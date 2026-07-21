import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersistedCollection } from '@/lib/storage/app-storage';
import { BackupRestoreSheet } from '@/components/BackupRestoreSheet';
import type { PageId, StickerIdentifier } from '@/data/album';
import { getI18nInstance } from '@/i18n/config';
import type { BackupErrorCode } from '@/services/backup-service';
import type { CollectionState } from '@/services/collection-service';
import type { SupportedLocale } from '@/services/locale-service';
import type { ThemeValue } from '@/services/theme-service';

const backupMocks = vi.hoisted(() => ({
  generateBackupPayload: vi.fn<() => { version: 1; exportedAt: string }>(() => ({
    version: 1,
    exportedAt: '2026-01-01T00:00:00.000Z'
  })),
  triggerBackupDownload: vi.fn<() => Promise<{ state: 'success' | 'cancelled' | 'error' }>>(),
  triggerRestore: vi.fn<
    () => Promise<
      | { state: 'success'; collection: PersistedCollection; locale?: string; theme?: string }
      | { state: 'cancelled' }
      | {
          state: 'error';
          code: BackupErrorCode;
          metadata?: { pageId?: string; stickerId?: string };
        }
    >
  >()
}));

vi.mock('@/services/backup-service', () => ({
  generateBackupPayload: backupMocks.generateBackupPayload,
  triggerBackupDownload: backupMocks.triggerBackupDownload,
  triggerRestore: backupMocks.triggerRestore
}));

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerId(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (predicate()) {
        resolve();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('waitFor timeout'));
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}

function mount(child: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(child);

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

function createMexPersistedCollection(): PersistedCollection {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { [asPageId('mex')]: { [asStickerId('MEX-1')]: 1 } };
}

async function resolveReadyRestoreResult() {
  return { state: 'ready' as const, value: {} as CollectionState };
}

function getSheetActionButton(index: number): HTMLButtonElement | null {
  const dialog = document.body.querySelector('[role="dialog"]');
  if (!dialog) {
    return null;
  }

  const buttons = dialog.querySelectorAll('button');
  return buttons[index] ?? null;
}

describe('BackupRestoreSheet', () => {
  beforeEach(async () => {
    await getI18nInstance().changeLanguage('en');
    backupMocks.generateBackupPayload.mockClear();
    backupMocks.triggerBackupDownload.mockReset();
    backupMocks.triggerRestore.mockReset();
  });

  it('does not render when closed', async () => {
    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: false,
        onClose: () => {},
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('closes sheet on export success', async () => {
    backupMocks.triggerBackupDownload.mockResolvedValueOnce({ state: 'success' });

    const onClose = vi.fn<() => void>();
    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose,
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const exportBtn = getSheetActionButton(2);
      exportBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 5000 });
      expect(backupMocks.triggerBackupDownload).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('shows export idle on export cancelled', async () => {
    backupMocks.triggerBackupDownload.mockResolvedValueOnce({ state: 'cancelled' });

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose: () => {},
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);
      const exportBtn = getSheetActionButton(2);
      exportBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(
        () =>
          document.body.textContent?.includes(
            'Export your collection to a file or restore it from a previous backup.'
          ) ?? false
      );
      expect(backupMocks.triggerBackupDownload).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it.each([
    ['invalid-json', 'valid JSON'],
    ['invalid-schema', 'valid Sticker Tracker backup'],
    ['unsupported-version', 'not supported'],
    ['missing-collection', 'does not contain collection data'],
    ['invalid-collection', 'format is invalid'],
    ['invalid-page-id', 'unknown page'],
    ['invalid-sticker-id', 'invalid sticker'],
    ['duplicate-sticker-id', 'duplicate stickers'],
    ['invalid-locale', 'unsupported language'],
    ['invalid-theme', 'unsupported theme'],
    ['read-error', 'Could not read']
  ])('shows restore error for $code', async (code, expectedText) => {
    const errorCode = code as BackupErrorCode;
    const metadata =
      errorCode === 'invalid-page-id'
        ? { pageId: 'bad' }
        : errorCode === 'invalid-sticker-id' || errorCode === 'duplicate-sticker-id'
          ? { pageId: 'mex', stickerId: 'MEX-1' }
          : undefined;

    const errorResult = metadata
      ? { state: 'error' as const, code: errorCode, metadata }
      : { state: 'error' as const, code: errorCode };

    backupMocks.triggerRestore.mockImplementation(() => Promise.resolve(errorResult));

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose: () => {},
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await waitFor(() => getSheetActionButton(3) !== null);
      getSheetActionButton(3)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // Wait for React to process async state updates from the resolved promise
      await vi.waitFor(() => document.body.textContent?.includes(expectedText) ?? false, {
        timeout: 5000,
        interval: 50
      });
      expect(backupMocks.triggerRestore).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('closes sheet on restore success with overwrite confirm', async () => {
    const onRestoreCollection = vi.fn<
      (collection: PersistedCollection) => Promise<{ state: 'ready'; value: CollectionState }>
    >(async (_collection: PersistedCollection) => ({
      state: 'ready',
      value: {
        [asPageId('mex')]: {
          [asStickerId('MEX-1')]: 1
        }
      }
    }));

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onClose = vi.fn<() => void>();

    backupMocks.triggerRestore.mockResolvedValueOnce({
      state: 'success',
      collection: createMexPersistedCollection()
    });

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose,
        collection: { [asPageId('mex')]: { [asStickerId('MEX-2')]: 1 } },
        locale: 'en',
        theme: 'system',
        onRestoreCollection
      })
    );

    try {
      await waitFor(() => getSheetActionButton(3) !== null);

      const restoreBtn = getSheetActionButton(3);
      restoreBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 5000 });
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(onRestoreCollection).toHaveBeenCalledTimes(1);
    } finally {
      confirmSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('handles restore write error', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onClose = vi.fn<() => void>();

    backupMocks.triggerRestore.mockResolvedValueOnce({
      state: 'success',
      collection: createMexPersistedCollection()
    });

    const onRestoreCollection = vi
      .fn<() => Promise<{ state: 'unavailable' }>>()
      .mockResolvedValue({ state: 'unavailable' });

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose,
        collection: { [asPageId('mex')]: { [asStickerId('MEX-2')]: 1 } },
        locale: 'en',
        theme: 'system',
        onRestoreCollection
      })
    );

    try {
      await waitFor(() => getSheetActionButton(3) !== null);

      const restoreBtn = getSheetActionButton(3);
      restoreBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await vi.waitFor(() => expect(onRestoreCollection).toHaveBeenCalledTimes(1), {
        timeout: 5000
      });
      // Write returns 'unavailable' — sheet shows error, does NOT close
      await waitFor(() => document.body.textContent?.includes('Could not restore backup') ?? false);
      expect(onClose).toHaveBeenCalledTimes(0);
    } finally {
      confirmSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('returns to idle when restore cancelled (file picker)', async () => {
    backupMocks.triggerRestore.mockResolvedValueOnce({ state: 'cancelled' });

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose: () => {},
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await waitFor(() => getSheetActionButton(3) !== null);

      const restoreBtn = getSheetActionButton(3);
      restoreBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await waitFor(
        () =>
          document.body.textContent?.includes(
            'Export your collection to a file or restore it from a previous backup.'
          ) ?? false
      );
      expect(backupMocks.triggerRestore).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('returns to idle when user declines overwrite confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    backupMocks.triggerRestore.mockResolvedValueOnce({
      state: 'success',
      collection: createMexPersistedCollection()
    });

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose: () => {},
        collection: { [asPageId('mex')]: { [asStickerId('MEX-2')]: 1 } },
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await waitFor(() => getSheetActionButton(3) !== null);

      const restoreBtn = getSheetActionButton(3);
      restoreBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await waitFor(
        () =>
          document.body.textContent?.includes(
            'Export your collection to a file or restore it from a previous backup.'
          ) ?? false
      );
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    } finally {
      confirmSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('shows export error when handleBackup throws', async () => {
    backupMocks.triggerBackupDownload.mockRejectedValueOnce(new Error('unexpected error'));

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose: () => {},
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const exportBtn = getSheetActionButton(2);
      exportBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Could not export backup') ?? false);
      expect(backupMocks.triggerBackupDownload).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls locale and theme restore callbacks on successful restore', async () => {
    const onClose = vi.fn<() => void>();
    const onRestoreLocale = vi.fn<(locale: SupportedLocale) => Promise<void>>(async () => {});
    const onRestoreTheme = vi.fn<(theme: ThemeValue) => Promise<void>>(async () => {});

    backupMocks.triggerRestore.mockResolvedValueOnce({
      state: 'success',
      collection: createMexPersistedCollection(),
      locale: 'pt-BR',
      theme: 'dark'
    });

    const mounted = mount(
      React.createElement(BackupRestoreSheet, {
        isOpen: true,
        onClose,
        collection: {},
        locale: 'en',
        theme: 'system',
        onRestoreCollection: resolveReadyRestoreResult,
        onRestoreLocale,
        onRestoreTheme
      })
    );

    try {
      await waitFor(() => getSheetActionButton(3) !== null);
      getSheetActionButton(3)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 5000 });
      expect(onRestoreLocale).toHaveBeenCalledWith('pt-BR');
      expect(onRestoreTheme).toHaveBeenCalledWith('dark');
    } finally {
      cleanup(mounted);
    }
  });
});

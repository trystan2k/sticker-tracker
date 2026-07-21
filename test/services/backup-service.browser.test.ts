import { describe, expect, it, vi } from 'vitest';

import { albumPages } from '@/data/album';
import { generateBackupPayload, triggerBackupDownload } from '@/services/backup-service';
import type { CollectionState } from '@/services/collection-service';
import { APP_VERSION } from '@/version';

function createCollection(): CollectionState {
  const [firstPage] = albumPages;

  if (!firstPage) {
    return {};
  }

  const [firstSticker] = firstPage.stickerIds;

  if (!firstSticker) {
    return {};
  }

  return {
    [firstPage.pageId]: {
      [firstSticker]: 1
    }
  };
}

describe('backup-service', () => {
  it('generates backup payload schema with collection and preferences', () => {
    const payload = generateBackupPayload(createCollection(), 'en', 'system');

    expect(payload.version).toBe(1);
    expect(payload.appVersion).toBe(APP_VERSION);
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.locale).toBe('en');
    expect(payload.theme).toBe('system');
    expect(Object.keys(payload)).toEqual([
      'version',
      'exportedAt',
      'appVersion',
      'collection',
      'locale',
      'theme'
    ]);
  });

  it('downloads backup via file picker when available', async () => {
    const writeMock = vi.fn<(data: Blob) => Promise<void>>(async () => {});
    const closeMock = vi.fn<() => Promise<void>>(async () => {});
    const createWritableMock = vi.fn<
      () => Promise<{ write: typeof writeMock; close: typeof closeMock }>
    >(async () => ({
      write: writeMock,
      close: closeMock
    }));
    const showSaveFilePickerMock = vi.fn<
      () => Promise<{ createWritable: typeof createWritableMock }>
    >(async () => ({
      createWritable: createWritableMock
    }));

    vi.stubGlobal('showSaveFilePicker', showSaveFilePickerMock);

    const result = await triggerBackupDownload(generateBackupPayload(createCollection()));

    expect(result).toEqual({ state: 'success' });
    expect(showSaveFilePickerMock).toHaveBeenCalledTimes(1);
    expect(createWritableMock).toHaveBeenCalledTimes(1);
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('returns cancelled when file picker is aborted', async () => {
    const showSaveFilePickerMock = vi.fn<() => Promise<never>>(async () => {
      throw new DOMException('cancelled', 'AbortError');
    });

    vi.stubGlobal('showSaveFilePicker', showSaveFilePickerMock);

    const result = await triggerBackupDownload(generateBackupPayload(createCollection()));

    expect(result).toEqual({ state: 'cancelled' });
  });

  it('returns error when file picker throws non-abort error', async () => {
    const showSaveFilePickerMock = vi.fn<() => Promise<never>>(async () => {
      throw new Error('save failed');
    });

    vi.stubGlobal('showSaveFilePicker', showSaveFilePickerMock);

    const result = await triggerBackupDownload(generateBackupPayload(createCollection()));

    expect(result).toEqual({ state: 'error' });
  });

  it('falls back to anchor download when file picker is unavailable', async () => {
    vi.useFakeTimers();

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    vi.stubGlobal('showSaveFilePicker', undefined);

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const result = await triggerBackupDownload(generateBackupPayload(createCollection()));
    await vi.runAllTimersAsync();

    expect(result).toEqual({ state: 'success' });
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('restores via fallback input when open file picker unavailable', async () => {
    const { triggerRestore } = await import('@/services/backup-service');

    vi.stubGlobal('showOpenFilePicker', undefined);

    const mockFile = new File(
      [
        '{"version":1,"exportedAt":"2026-01-01T00:00:00.000Z","appVersion":"1.0.0","collection":{"mex":["MEX-1"]},"locale":"en","theme":"system"}'
      ],
      'backup.json',
      { type: 'application/json' }
    );

    const originalCreateElement = document.createElement.bind(document);
    const mockInput = originalCreateElement('input');
    const changeListeners: EventListener[] = [];
    const focusListeners: EventListener[] = [];

    const origAddEventListener = mockInput.addEventListener.bind(mockInput);
    mockInput.addEventListener = function (type: string, listener: EventListener) {
      if (type === 'change') changeListeners.push(listener);
      if (type === 'focus') focusListeners.push(listener);
      return origAddEventListener(type, listener);
    };

    const origRemoveEventListener = mockInput.removeEventListener.bind(mockInput);
    mockInput.removeEventListener = function (type: string, listener: EventListener) {
      if (type === 'change') {
        const idx = changeListeners.indexOf(listener);
        if (idx >= 0) changeListeners.splice(idx, 1);
      }
      if (type === 'focus') {
        const idx = focusListeners.indexOf(listener);
        if (idx >= 0) focusListeners.splice(idx, 1);
      }
      return origRemoveEventListener(type, listener);
    };

    Object.defineProperty(mockInput, 'files', {
      get() {
        const list = new DataTransfer();
        list.items.add(mockFile);
        return list.files;
      }
    });

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'input') return mockInput;
        return originalCreateElement(tag);
      });

    const bodyAppendSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockInput);
    const bodyRemoveSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockInput);

    const clickSpy = vi.spyOn(mockInput, 'click').mockImplementation(() => {
      setTimeout(() => {
        for (const listener of changeListeners) {
          listener(new Event('change'));
        }
      }, 0);
    });

    const result = await triggerRestore();

    expect(result).toEqual({
      state: 'success',
      collection: { mex: ['MEX-1'] },
      locale: 'en',
      theme: 'system'
    });

    createElementSpy.mockRestore();
    bodyAppendSpy.mockRestore();
    bodyRemoveSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('returns cancelled when fallback input has no file selected', async () => {
    const { triggerRestore } = await import('@/services/backup-service');

    vi.stubGlobal('showOpenFilePicker', undefined);

    const originalCreateElement = document.createElement.bind(document);
    const mockInput = originalCreateElement('input');
    const changeListeners: EventListener[] = [];
    let windowFocusListener: ((evt: Event) => void) | null = null;

    const origAddEventListener = mockInput.addEventListener.bind(mockInput);
    mockInput.addEventListener = function (type: string, listener: EventListener) {
      if (type === 'change') changeListeners.push(listener);
      return origAddEventListener(type, listener);
    };

    const origWindowAddEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation(
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      function (type: string, listener: EventListenerOrEventListenerObject) {
        if (type === 'focus' && typeof listener === 'function') {
          windowFocusListener = listener;
        }
        return origWindowAddEventListener(type, listener);
      }
    );

    Object.defineProperty(mockInput, 'files', {
      get() {
        const list = new DataTransfer();
        return list.files;
      }
    });

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'input') return mockInput;
        return originalCreateElement(tag);
      });

    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockInput);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockInput);
    vi.spyOn(mockInput, 'click').mockImplementation(() => {
      // Simulate window focus after dialog dismissed (no file selected)
      setTimeout(() => {
        if (windowFocusListener) {
          windowFocusListener(new Event('focus'));
        }
      }, 10);
    });

    const result = await triggerRestore();

    expect(result).toEqual({ state: 'cancelled' });

    createElementSpy.mockRestore();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { PwaProvider, usePwa } from '@/providers/PwaProvider';
import type { PwaRegistrationResult } from '@/services/pwa-registration';

const mocks = vi.hoisted(() => ({
  updateServiceWorker: vi.fn<(immediate?: boolean) => Promise<void>>().mockResolvedValue()
}));

vi.mock('@/services/pwa-registration', () => ({
  registerPwa: vi.fn<() => PwaRegistrationResult>().mockReturnValue({
    updateServiceWorker: mocks.updateServiceWorker
  }),
  resetPwaRegistrationForTests: vi.fn<() => void>()
}));

function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      try {
        if (predicate()) {
          resolve();
          return;
        }
      } catch {
        // predicate may throw, keep polling
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

function mountProvider(child: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(React.createElement(PwaProvider, null, child));

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

describe('PwaProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.updateServiceWorker.mockClear();
  });

  describe('basic rendering', () => {
    it('renders children when SW registration succeeds', async () => {
      let capturedContext: ReturnType<typeof usePwa> | null = null;

      function ContextReader() {
        capturedContext = usePwa();
        return React.createElement('div', { 'data-testid': 'child' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null);

        expect(mounted.container.querySelector('[data-testid="child"]')).not.toBeNull();
        expect(capturedContext!.isUpdateAvailable).toBe(false);
        expect(capturedContext!.isUpdateDismissed).toBe(false);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('install prompt events', () => {
    it('beforeinstallprompt sets install banner visible and platform to chromium', async () => {
      let capturedContext: ReturnType<typeof usePwa> | null = null;

      function ContextReader() {
        capturedContext = usePwa();
        return React.createElement('div', { 'data-testid': 'child' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null);

        const promptEvent = new Event('beforeinstallprompt', { cancelable: true });
        Object.assign(promptEvent, {
          prompt: vi.fn<() => Promise<void>>().mockResolvedValue(),
          userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' })
        });

        window.dispatchEvent(promptEvent);

        await waitFor(() => capturedContext!.isInstallBannerVisible);

        expect(capturedContext!.isInstallBannerVisible).toBe(true);
        expect(capturedContext!.canPromptInstall).toBe(true);
        expect(capturedContext!.installPlatform).toBe('chromium');
      } finally {
        cleanup(mounted);
      }
    });

    it('appinstalled clears install banner state', async () => {
      let capturedContext: ReturnType<typeof usePwa> | null = null;

      function ContextReader() {
        capturedContext = usePwa();
        return React.createElement('div', { 'data-testid': 'child' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null);

        // First trigger beforeinstallprompt to set banner visible
        const promptEvent = new Event('beforeinstallprompt', { cancelable: true });
        Object.assign(promptEvent, {
          prompt: vi.fn<() => Promise<void>>().mockResolvedValue(),
          userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' })
        });
        window.dispatchEvent(promptEvent);

        await waitFor(() => capturedContext!.isInstallBannerVisible);

        // Then trigger appinstalled
        window.dispatchEvent(new Event('appinstalled'));

        await waitFor(() => !capturedContext!.isInstallBannerVisible);

        expect(capturedContext!.isInstallBannerVisible).toBe(false);
        expect(capturedContext!.canPromptInstall).toBe(false);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('update flow', () => {
    it('onNeedRefresh callback sets isUpdateAvailable to true', async () => {
      const { registerPwa } = await import('@/services/pwa-registration');

      let onNeedRefresh: (() => void) | undefined;

      vi.mocked(registerPwa).mockImplementation((options) => {
        onNeedRefresh = options.onNeedRefresh;
        return { updateServiceWorker: mocks.updateServiceWorker };
      });

      let capturedContext: ReturnType<typeof usePwa> | null = null;

      function ContextReader() {
        capturedContext = usePwa();
        return React.createElement('div', { 'data-testid': 'child' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null && onNeedRefresh !== undefined);

        onNeedRefresh!();

        await waitFor(() => capturedContext!.isUpdateAvailable);

        expect(capturedContext!.isUpdateAvailable).toBe(true);
        expect(capturedContext!.isUpdateDismissed).toBe(false);
      } finally {
        cleanup(mounted);
      }
    });

    it('dismissUpdate sets isUpdateDismissed to true', async () => {
      const { registerPwa } = await import('@/services/pwa-registration');

      let onNeedRefresh: (() => void) | undefined;

      vi.mocked(registerPwa).mockImplementation((options) => {
        onNeedRefresh = options.onNeedRefresh;
        return { updateServiceWorker: mocks.updateServiceWorker };
      });

      let capturedContext: ReturnType<typeof usePwa> | null = null;

      function ContextReader() {
        capturedContext = usePwa();
        return React.createElement('div', { 'data-testid': 'child' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null && onNeedRefresh !== undefined);

        onNeedRefresh!();
        await waitFor(() => capturedContext!.isUpdateAvailable);

        capturedContext!.dismissUpdate();

        await waitFor(() => capturedContext!.isUpdateDismissed);

        expect(capturedContext!.isUpdateDismissed).toBe(true);
      } finally {
        cleanup(mounted);
      }
    });

    it('applyUpdate calls the update function with immediate=true', async () => {
      let capturedContext: ReturnType<typeof usePwa> | null = null;

      function ContextReader() {
        capturedContext = usePwa();
        return React.createElement('div', { 'data-testid': 'child' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null);

        await capturedContext!.applyUpdate();

        expect(mocks.updateServiceWorker).toHaveBeenCalledTimes(1);
        expect(mocks.updateServiceWorker).toHaveBeenCalledWith(true);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('usage outside provider', () => {
    it('usePwa returns default values when used outside PwaProvider', async () => {
      function OutsideConsumer() {
        const pwa = usePwa();
        return React.createElement('div', {
          'data-testid': 'outside',
          'data-value': JSON.stringify({
            isUpdateAvailable: pwa.isUpdateAvailable,
            isUpdateDismissed: pwa.isUpdateDismissed,
            isOfflineReady: pwa.isOfflineReady,
            installPlatform: pwa.installPlatform,
            isInstallBannerVisible: pwa.isInstallBannerVisible,
            isInstallSheetOpen: pwa.isInstallSheetOpen,
            canPromptInstall: pwa.canPromptInstall
          })
        });
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(React.createElement(OutsideConsumer));

      try {
        await waitFor(() => container.querySelector('[data-testid="outside"]') !== null);

        const el = container.querySelector('[data-testid="outside"]');
        expect(el).not.toBeNull();

        const value = JSON.parse(el?.getAttribute('data-value') ?? '{}');
        expect(value.isUpdateAvailable).toBe(false);
        expect(value.isUpdateDismissed).toBe(false);
        expect(value.isOfflineReady).toBe(false);
        expect(value.installPlatform).toBe('unsupported');
        expect(value.isInstallBannerVisible).toBe(false);
        expect(value.isInstallSheetOpen).toBe(false);
        expect(value.canPromptInstall).toBe(false);
      } finally {
        root.unmount();
        container.remove();
      }
    });
  });
});

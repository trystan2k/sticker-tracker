import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';

const usePwaMock = vi.fn<
  () => {
    isInstallBannerVisible: boolean;
    promptInstall: () => Promise<void>;
    dismissInstallBanner: () => void;
  }
>();

vi.mock('@/providers/PwaProvider', () => ({
  usePwa: () => usePwaMock()
}));

function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
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

describe('PwaInstallBanner', () => {
  it('renders nothing when banner hidden', () => {
    usePwaMock.mockReturnValue({
      isInstallBannerVisible: false,
      promptInstall: vi.fn<() => Promise<void>>().mockResolvedValue(),
      dismissInstallBanner: vi.fn<() => void>()
    });

    const mounted = mount(React.createElement(PwaInstallBanner));

    try {
      expect(mounted.container.textContent).toBe('');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders banner and triggers actions', async () => {
    const promptInstall = vi.fn<() => Promise<void>>().mockResolvedValue();
    const dismissInstallBanner = vi.fn<() => void>();

    usePwaMock.mockReturnValue({
      isInstallBannerVisible: true,
      promptInstall,
      dismissInstallBanner
    });

    const mounted = mount(React.createElement(PwaInstallBanner));

    try {
      await waitFor(() => mounted.container.textContent?.includes('Install') ?? false);

      const buttons = mounted.container.querySelectorAll('button');
      buttons[0]?.click();
      buttons[1]?.click();

      expect(promptInstall).toHaveBeenCalledTimes(1);
      expect(dismissInstallBanner).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

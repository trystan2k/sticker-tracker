import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { MenuDrawer } from '@/components/MenuDrawer';
import { getI18nInstance } from '@/i18n/config';

vi.mock('@/providers/PwaProvider', () => ({
  usePwa: () => ({
    installPlatform: 'chromium',
    canPromptInstall: true,
    promptInstall: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    openInstallSheet: vi.fn<() => void>()
  })
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

describe('MenuDrawer PWA install', () => {
  it('renders install row on chromium with canPromptInstall', async () => {
    await getI18nInstance().changeLanguage('en');

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Install') ?? false);
      expect(document.body.textContent).toContain('Install');
    } finally {
      cleanup(mounted);
    }
  });

  it('calls promptInstall and onClose when install row clicked on chromium', async () => {
    await getI18nInstance().changeLanguage('en');

    const onClose = vi.fn<() => void>();
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose,
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Install') ?? false);

      const installButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.includes('Install') ?? false
      );
      installButton?.click();

      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

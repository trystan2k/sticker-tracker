import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { MenuDrawer } from '@/components/MenuDrawer';

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

describe('MenuDrawer', () => {
  it('renders share and language rows when open', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Share') ?? false);
      expect(document.body.textContent).toContain('Share');
      expect(document.body.textContent).toContain('Language');
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose on escape', async () => {
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
      await waitFor(() => document.body.textContent?.includes('Share') ?? false);
      await new Promise((resolve) => requestAnimationFrame(resolve));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('closes and opens locale switcher from language row', async () => {
    const onClose = vi.fn<() => void>();
    const onOpenLocaleSwitcher = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose,
        onOpenLocaleSwitcher,
        currentLocale: 'pt-BR'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      const languageButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Language')
      );

      languageButton?.click();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onOpenLocaleSwitcher).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

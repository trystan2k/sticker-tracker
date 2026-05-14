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

  it('cycles focus forward on Tab from last element', async () => {
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

      const panel = document.querySelector('[role="dialog"]');
      expect(panel).not.toBeNull();

      const focusable = panel!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusable.length).toBeGreaterThan(1);

      const lastElement = focusable[focusable.length - 1]!;
      lastElement.focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

      expect(document.activeElement).toBe(focusable[0]);
    } finally {
      cleanup(mounted);
    }
  });

  it('cycles focus backward on Shift+Tab from first element', async () => {
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

      const panel = document.querySelector('[role="dialog"]');
      expect(panel).not.toBeNull();

      const focusable = panel!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusable.length).toBeGreaterThan(1);

      focusable[0]!.focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));

      expect(document.activeElement).toBe(focusable[focusable.length - 1]!);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders share button as disabled', async () => {
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

      const shareButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Share'
      );

      expect(shareButton).toBeDefined();
      expect(shareButton?.hasAttribute('disabled')).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders share button as enabled when onOpenShare exists', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenShare: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      const shareButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Share'
      );

      expect(shareButton).toBeDefined();
      expect(shareButton?.hasAttribute('disabled')).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onOpenShare when share button is clicked', async () => {
    const onOpenShare = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenShare,
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      const shareButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Share'
      );

      shareButton?.click();
      expect(onOpenShare).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('does not render when initially closed', () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: false,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'en'
      })
    );

    try {
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders with closing animation when isOpen changes from true to false', async () => {
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

      // Trigger close
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(onClose).toHaveBeenCalledTimes(1);

      // Dialog should still be in DOM during closing animation
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders version footer', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('v1.') ?? false);

      expect(document.body.textContent).toMatch(/v\d+\.\d+\.\d+/);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders flag icon for pt-BR locale', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'pt-BR'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      const flag = document.body.querySelector('.fi-br');
      expect(flag).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders flag icon for es locale', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'es'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      const flag = document.body.querySelector('.fi-es');
      expect(flag).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders flag icon for en locale (default)', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      const flag = document.body.querySelector('.fi-us');
      expect(flag).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

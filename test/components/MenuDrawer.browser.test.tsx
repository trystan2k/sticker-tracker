import { beforeEach, describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { getI18nInstance } from '@/i18n/config';

import { MenuDrawer } from '@/components/MenuDrawer';

vi.mock('@/providers/PwaProvider', () => ({
  usePwa: () => ({
    installPlatform: 'unsupported',
    canPromptInstall: false,
    promptInstall: async () => {},
    openInstallSheet: () => {}
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

describe('MenuDrawer', () => {
  beforeEach(async () => {
    await getI18nInstance().changeLanguage('en');
  });

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
        onOpenThemeSwitcher: () => {},
        onOpenDeleteConfirm: () => {},
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
        (button) => button.textContent?.includes('Share') ?? false
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
        (button) => button.textContent?.includes('Share') ?? false
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
        (button) => button.textContent?.includes('Share') ?? false
      );

      shareButton?.click();
      expect(onOpenShare).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders scanner entry as second row after share', async () => {
    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenScanner: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Scanner') ?? false);

      const rowLabels = Array.from(document.body.querySelectorAll('[class*="rowLabel"]')).map(
        (node) => node.textContent?.trim()
      );

      const shareIndex = rowLabels.findIndex((label) => label?.includes('Share') ?? false);
      const scannerIndex = rowLabels.findIndex((label) => label === 'Scanner');

      expect(shareIndex).toBeGreaterThanOrEqual(0);
      expect(scannerIndex).toBe(shareIndex + 1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onOpenScanner when scanner row clicked', async () => {
    const onOpenScanner = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenScanner,
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Scanner') ?? false);

      const scannerButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Scanner'
      );

      scannerButton?.click();
      expect(onOpenScanner).toHaveBeenCalledTimes(1);
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

  it('calls onOpenThemeSwitcher when theme row clicked', async () => {
    const onOpenThemeSwitcher = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenThemeSwitcher,
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Theme') ?? false);

      const themeButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.includes('Theme') ?? false
      );
      themeButton?.click();
      expect(onOpenThemeSwitcher).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onOpenDeleteConfirm when delete row clicked', async () => {
    const onOpenDeleteConfirm = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenDeleteConfirm,
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Delete') ?? false);

      const deleteButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.includes('Delete') ?? false
      );
      deleteButton?.click();
      expect(onOpenDeleteConfirm).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

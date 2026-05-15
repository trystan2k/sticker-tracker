import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { ThemeSheet } from '@/components/ThemeSheet';
import { type ThemeValue } from '@/services/theme-service';

function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
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

describe('ThemeSheet', () => {
  it('does not render when isOpen is false', async () => {
    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: false,
        onClose: () => {},
        currentTheme: 'system' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders sheet with all 3 theme options when open', async () => {
    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {},
        currentTheme: 'system' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const lightBtn = document.body.querySelector('button[aria-label="Light"]');
      const darkBtn = document.body.querySelector('button[aria-label="Dark"]');
      const systemBtn = document.body.querySelector('button[aria-label="System"]');

      expect(lightBtn).not.toBeNull();
      expect(darkBtn).not.toBeNull();
      expect(systemBtn).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onSelectTheme with correct value when theme row is clicked', async () => {
    const onSelectTheme = vi.fn<(theme: ThemeValue) => void>();
    let onCloseCalls = 0;

    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {
          onCloseCalls += 1;
        },
        currentTheme: 'system' as ThemeValue,
        onSelectTheme: onSelectTheme
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const darkBtn = document.body.querySelector('button[aria-label="Dark"]') as HTMLButtonElement;
      darkBtn?.click();

      expect(onSelectTheme).toHaveBeenCalledWith('dark');
      expect(onCloseCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose when backdrop is clicked', async () => {
    let onCloseCalls = 0;

    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {
          onCloseCalls += 1;
        },
        currentTheme: 'light' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const dialog = document.body.querySelector('[role="dialog"]') as HTMLDivElement;
      const backdrop = dialog.querySelector('button') as HTMLButtonElement;
      backdrop.click();

      expect(onCloseCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose when Escape key is pressed', async () => {
    let onCloseCalls = 0;

    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {
          onCloseCalls += 1;
        },
        currentTheme: 'dark' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      // Wait for useEffect to attach keydown listener
      await new Promise((resolve) => requestAnimationFrame(resolve));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onCloseCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose when close button is clicked', async () => {
    let onCloseCalls = 0;

    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {
          onCloseCalls += 1;
        },
        currentTheme: 'light' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const closeBtn = document.body.querySelector(
        'button[aria-label="Close"]'
      ) as HTMLButtonElement;
      expect(closeBtn).not.toBeNull();

      closeBtn?.click();

      expect(onCloseCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('shows checkmark on selected theme', async () => {
    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {},
        currentTheme: 'dark' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const darkBtn = document.body.querySelector('button[aria-label="Dark"]');
      expect(darkBtn).not.toBeNull();

      const checkIcon = darkBtn?.querySelector('[aria-hidden="true"]:last-child');
      expect(checkIcon).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('does not show checkmark on non-selected themes', async () => {
    const mounted = mount(
      React.createElement(ThemeSheet, {
        isOpen: true,
        onClose: () => {},
        currentTheme: 'dark' as ThemeValue,
        onSelectTheme: () => {}
      })
    );

    try {
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const lightBtn = document.body.querySelector('button[aria-label="Light"]');
      expect(lightBtn).not.toBeNull();

      // Light button should have only 1 aria-hidden element (the icon), not a checkmark
      const ariaHiddenElements = lightBtn?.querySelectorAll('[aria-hidden="true"]');
      expect(ariaHiddenElements?.length).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });
});

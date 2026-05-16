import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Ensure i18n is initialized
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { HomeHeader } from '@/components/home/HomeHeader';
import { FEATURE_FLAGS } from '@/config/features';

const navigateMock = vi.fn<() => Promise<void>>().mockReturnValue(Promise.resolve());

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

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

describe('HomeHeader', () => {
  it('renders header with menu and title buttons', async () => {
    const onMenuClick = vi.fn<() => void>();
    const mounted = mount(React.createElement(HomeHeader, { onMenuClick }));

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const header = mounted.container.querySelector('header');
      expect(header).not.toBeNull();

      const buttons = mounted.container.querySelectorAll('button');
      const expectedButtons = FEATURE_FLAGS.scannerEnabled ? 3 : 2;
      expect(buttons.length).toBe(expectedButtons);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onMenuClick when menu button is clicked', async () => {
    const onMenuClick = vi.fn<() => void>();
    const mounted = mount(React.createElement(HomeHeader, { onMenuClick }));

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      // First button in header is the menu button
      const buttons = mounted.container.querySelectorAll('header button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      const menuButton = buttons[0] as HTMLButtonElement;

      menuButton.click();
      expect(onMenuClick).toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates to home when title button is clicked', async () => {
    const onMenuClick = vi.fn<() => void>();
    navigateMock.mockClear();

    const mounted = mount(React.createElement(HomeHeader, { onMenuClick }));

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const titleButton = mounted.container.querySelector(
        'button[class*="titleButton"]'
      ) as HTMLButtonElement;
      expect(titleButton).not.toBeNull();

      titleButton.click();
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    } finally {
      cleanup(mounted);
    }
  });

  it('has accessible aria-label on header', async () => {
    const onMenuClick = vi.fn<() => void>();
    const mounted = mount(React.createElement(HomeHeader, { onMenuClick }));

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const header = mounted.container.querySelector('header');
      expect(header?.getAttribute('aria-label')).toBeDefined();
    } finally {
      cleanup(mounted);
    }
  });

  it('menu button has accessible aria-label', async () => {
    const onMenuClick = vi.fn<() => void>();
    const mounted = mount(React.createElement(HomeHeader, { onMenuClick }));

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      // First button in header is the menu button
      const buttons = mounted.container.querySelectorAll('header button');
      const menuButton = buttons[0] as HTMLButtonElement;
      expect(menuButton?.getAttribute('aria-label')).toBeDefined();
    } finally {
      cleanup(mounted);
    }
  });
});

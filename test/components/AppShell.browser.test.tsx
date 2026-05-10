import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetAllData,
  resetStorageStateForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';
import { AppShell } from '@/components/AppShell';

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

async function resetStorage() {
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  await resetAllData();
}

describe('AppShell', () => {
  it('renders children inside main element', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(
          AppShell,
          null,
          React.createElement('div', { 'data-testid': 'child-content' }, 'Hello')
        )
      )
    );

    try {
      await waitFor(() => {
        const child = mounted.container.querySelector('[data-testid="child-content"]');
        return child !== null;
      });

      const main = mounted.container.querySelector('main');
      expect(main).not.toBeNull();
      expect(main?.querySelector('[data-testid="child-content"]')).not.toBeNull();
      expect(main?.textContent).toContain('Hello');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders localeSwitcher in header when provided', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(AppShell, {
          localeSwitcher: React.createElement(
            'div',
            { 'data-testid': 'locale-switcher' },
            'Switcher'
          ),
          // oxlint-disable-next-line react/no-children-prop
          children: React.createElement('div', { 'data-testid': 'child-content' })
        })
      )
    );

    try {
      await waitFor(() => {
        const child = mounted.container.querySelector('[data-testid="child-content"]');
        return child !== null;
      });

      const header = mounted.container.querySelector('header');
      expect(header).not.toBeNull();
      expect(header?.querySelector('[data-testid="locale-switcher"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('does not render headerActions when localeSwitcher is not provided', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(
          AppShell,
          null,
          React.createElement('div', { 'data-testid': 'child-content' })
        )
      )
    );

    try {
      await waitFor(() => {
        const child = mounted.container.querySelector('[data-testid="child-content"]');
        return child !== null;
      });

      const headerActions = mounted.container.querySelector('[class*="headerActions"]');
      expect(headerActions).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders main element even with empty children', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(AppShell, null, null))
    );

    try {
      await waitFor(() => {
        const main = mounted.container.querySelector('main');
        return main !== null;
      });

      const main = mounted.container.querySelector('main');
      expect(main).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders nav and overlay elements', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(
          AppShell,
          null,
          React.createElement('div', { 'data-testid': 'child-content' })
        )
      )
    );

    try {
      await waitFor(() => {
        const child = mounted.container.querySelector('[data-testid="child-content"]');
        return child !== null;
      });

      const nav = mounted.container.querySelector('nav');
      expect(nav).not.toBeNull();
      expect(nav?.getAttribute('aria-label')).toBe('Navigation');

      const overlays = mounted.container.querySelectorAll('[aria-live="polite"]');
      expect(overlays.length).toBeGreaterThanOrEqual(2);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders logo text in header', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(
          AppShell,
          null,
          React.createElement('div', { 'data-testid': 'child-content' })
        )
      )
    );

    try {
      await waitFor(() => {
        const child = mounted.container.querySelector('[data-testid="child-content"]');
        return child !== null;
      });

      const header = mounted.container.querySelector('header');
      expect(header?.textContent).toContain('stickers');
    } finally {
      cleanup(mounted);
    }
  });
});

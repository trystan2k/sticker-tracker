import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';
import { NotFoundPage } from '@/components/not-found/NotFoundPage';

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    Link: React.forwardRef<
      HTMLAnchorElement,
      { to: string; children: React.ReactNode; className?: string }
    >(({ to, children, className }, ref) =>
      React.createElement('a', { href: to, className, ref }, children)
    ),
    useNavigate: () => vi.fn<() => void>()
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

let testCounter = 0;

async function resetStorage() {
  testCounter++;
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  setDatabaseNameForTests(`test-notfound-${testCounter}`);
}

describe('NotFoundPage', () => {
  it('renders heading and description', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Page not found') ?? false);

      expect(document.body.textContent).toContain('Page not found');
      expect(document.body.textContent).toContain("doesn't exist");
    } finally {
      cleanup(mounted);
    }
  });

  it('renders CTA link to home', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const link = document.body.querySelector('a');
        return link !== null;
      });

      const link = document.body.querySelector('a');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/');
      expect(link?.textContent).toBe('Go to home');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders SearchX icon', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const svg = document.body.querySelector('svg');
        return svg !== null;
      });

      const svg = document.body.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders header with menu button', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const header = document.body.querySelector('header');
        return header !== null;
      });

      const header = document.body.querySelector('header');
      expect(header).not.toBeNull();

      const menuButton = header?.querySelector('button');
      expect(menuButton).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders MenuDrawer component (closed by default)', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Page not found') ?? false);

      // MenuDrawer should not be visible initially (isOpen=false)
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders LocaleSwitcher component (closed by default)', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Page not found') ?? false);

      // LocaleSwitcher should not be visible initially (isOpen=false)
      const localeDialog = document.body.querySelector('[aria-label="Language / Idioma"]');
      expect(localeDialog).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens menu drawer when menu button is clicked', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const header = document.body.querySelector('header');
        return header !== null;
      });

      const menuButton = document.body.querySelector('header button') as HTMLButtonElement;
      expect(menuButton).not.toBeNull();

      menuButton?.click();

      // Wait for MenuDrawer to appear
      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      expect(document.body.textContent).toContain('Share');
      expect(document.body.textContent).toContain('Language');
    } finally {
      cleanup(mounted);
    }
  });

  it('closes menu drawer on escape', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const header = document.body.querySelector('header');
        return header !== null;
      });

      // Open drawer
      const menuButton = document.body.querySelector('header button') as HTMLButtonElement;
      menuButton?.click();

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      // Close with escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Wait for drawer to close
      await waitFor(() => {
        const dialog = document.body.querySelector('[role="dialog"]');
        return dialog === null;
      });

      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens locale switcher from menu drawer language row', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const header = document.body.querySelector('header');
        return header !== null;
      });

      // Open drawer
      const menuButton = document.body.querySelector('header button') as HTMLButtonElement;
      menuButton?.click();

      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      // Click language row
      const languageButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.includes('Language') ?? false
      ) as HTMLButtonElement;

      languageButton?.click();

      // Wait for LocaleSwitcher to appear
      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('closes locale switcher on escape', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(NotFoundPage))
    );

    try {
      await waitFor(() => {
        const header = document.body.querySelector('header');
        return header !== null;
      });

      // Open drawer
      const menuButton = document.body.querySelector('header button') as HTMLButtonElement;
      menuButton?.click();

      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      // Open locale switcher
      const languageButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.includes('Language') ?? false
      ) as HTMLButtonElement;
      languageButton?.click();

      await waitFor(() => document.body.querySelector('[role="dialog"]') !== null);

      // Close with escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Wait for locale switcher to close
      await waitFor(() => {
        const dialog = document.body.querySelector('[aria-label="Language / Idioma"]');
        return dialog === null;
      });

      expect(document.body.querySelector('[aria-label="Language / Idioma"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

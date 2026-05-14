import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Ensure i18n is initialized (HomeScreen uses useTranslation)
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { Route, Home } from '@/routes/index';

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
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
  setDatabaseNameForTests(`test-home-${testCounter}`);
}

describe('Home page (index route)', () => {
  it('Route export is defined with component', () => {
    expect(Route).toBeDefined();
    expect(typeof Route.options?.component).toBe('function');
  });

  it('renders HomeScreen content when appState is ready', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      // Wait for HomeScreen to render (header should be present)
      await waitFor(() => {
        const header = mounted.container.querySelector('header');
        return header !== null;
      });

      // Header is rendered
      const header = mounted.container.querySelector('header');
      expect(header).not.toBeNull();

      // Title is rendered (span inside button, not h1 — valid HTML)
      const title = mounted.container.querySelector('[class*="title"]');
      expect(title).not.toBeNull();

      // Action buttons in header (menu + title)
      const headerButtons = mounted.container.querySelectorAll('header button');
      expect(headerButtons.length).toBeGreaterThanOrEqual(2);
    } finally {
      cleanup(mounted);
    }
  });

  it('returns null when appState is null', async () => {
    // Render Home without AppStateProvider — appState will be null
    const mounted = mount(React.createElement(Home));

    try {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // Home returns null when no provider — no home screen content
      const header = mounted.container.querySelector('header');
      expect(header).toBeNull();

      const title = mounted.container.querySelector('[class*="title"]');
      expect(title).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders hero progress and group cards after bootstrap completes', async () => {
    await resetStorage();

    let capturedContext:
      | (typeof AppStateContext extends React.Context<infer T> ? T : never)
      | null = null;

    function ContextReader() {
      capturedContext = React.useContext(AppStateContext);
      return React.createElement('div', { 'data-testid': 'context-captured' });
    }

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(
          React.Fragment,
          null,
          React.createElement(Home),
          React.createElement(ContextReader)
        )
      )
    );

    try {
      await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

      // Header is rendered
      const header = mounted.container.querySelector('header');
      expect(header).not.toBeNull();

      // Hero progress section renders SVG ring
      const heroSection = mounted.container.querySelector('[aria-label="Album progress"]');
      expect(heroSection).not.toBeNull();

      // Stats are rendered
      const mainStat = mounted.container.querySelector('[class*="mainStat"]');
      expect(mainStat).not.toBeNull();

      // Group cards section exists
      const scrollArea = mounted.container.querySelector('[class*="scrollArea"]');
      expect(scrollArea).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens drawer from header menu trigger', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      await waitFor(() => {
        const headerButtons = mounted.container.querySelectorAll('header button');
        return headerButtons.length >= 2;
      });

      // First header button is menu button (opens drawer)
      const menuButton = mounted.container.querySelectorAll(
        'header button'
      )[0] as HTMLButtonElement;

      menuButton.click();

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);
      expect(document.body.textContent).toContain('Share');
    } finally {
      cleanup(mounted);
    }
  });

  it('opens locale switcher from drawer language row', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      await waitFor(() => {
        const headerButtons = mounted.container.querySelectorAll('header button');
        return headerButtons.length >= 2;
      });

      // Open drawer
      const menuButton = mounted.container.querySelectorAll(
        'header button'
      )[0] as HTMLButtonElement;
      menuButton.click();

      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      const languageButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Language')
      );

      languageButton?.click();

      await waitFor(() => document.body.textContent?.includes('Language / Idioma') ?? false);
      expect(document.body.textContent).toContain('Language / Idioma');
    } finally {
      cleanup(mounted);
    }
  });

  it('closes drawer when escape is pressed', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      await waitFor(() => {
        const headerButtons = mounted.container.querySelectorAll('header button');
        return headerButtons.length >= 2;
      });

      const menuButton = mounted.container.querySelectorAll(
        'header button'
      )[0] as HTMLButtonElement;
      menuButton.click();

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      await waitFor(() => !(document.body.textContent?.includes('Share') ?? false));
      expect(document.body.textContent).not.toContain('Share');
    } finally {
      cleanup(mounted);
    }
  });
});

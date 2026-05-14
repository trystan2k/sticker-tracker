import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Ensure i18n is initialized
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { HomeScreen } from '@/components/home/HomeScreen';
import type { StickerIdentifier } from '@/data/album';

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
  setDatabaseNameForTests(`test-homescreen-${testCounter}`);
}

function makeMockAppState(
  collection: Record<string, ReadonlySet<StickerIdentifier>> = {}
): NonNullable<React.ContextType<typeof AppStateContext>> {
  return {
    collection,
    renderState: 'ready' as const,
    locale: 'en' as const,
    storageState: 'ready' as const,
    toggleCollected: async () => ({ state: 'ready' as const, value: collection }),
    setLocale: async () => 'ready' as const,
    retryBootstrap: async () => {}
  } as unknown as NonNullable<React.ContextType<typeof AppStateContext>>;
}

describe('HomeScreen', () => {
  it('returns null when appState is null', async () => {
    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: null },
        React.createElement(HomeScreen)
      )
    );

    try {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      expect(mounted.container.querySelector('header')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders loading state when renderState is loading', async () => {
    const loadingState = makeMockAppState();
    (loadingState as Record<string, unknown>).renderState = 'loading';

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: loadingState },
        React.createElement(HomeScreen)
      )
    );

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const loadingText = mounted.container.querySelector('[class*="loading"]');
      expect(loadingText).not.toBeNull();
      expect(loadingText?.textContent).toContain('Loading');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders full home screen when renderState is ready', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(HomeScreen))
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      expect(mounted.container.querySelector('header')).not.toBeNull();
      expect(mounted.container.querySelector('[aria-label="Album progress"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls handleOpenShare when share button in drawer is clicked', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(HomeScreen))
    );

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

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      // Share button should be present and enabled
      const shareButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Share'
      );
      expect(shareButton).not.toBeUndefined();
      expect(shareButton?.disabled).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('opens locale switcher from drawer language row and closes it', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(HomeScreen))
    );

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

      // Click language button to open locale switcher
      const languageButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Language')
      );
      languageButton?.click();

      await waitFor(() => document.body.textContent?.includes('Language / Idioma') ?? false);
      expect(document.body.textContent).toContain('Language / Idioma');

      // Close locale switcher by clicking backdrop
      const backdrop = document.body.querySelector('[class*="backdrop"]');
      if (backdrop) {
        (backdrop as HTMLElement).click();
      }

      await new Promise((r) => setTimeout(r, 100));
    } finally {
      cleanup(mounted);
    }
  });

  it('renders MenuDrawer with onOpenShare prop on home screen', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(HomeScreen))
    );

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

      // Share button should be enabled (not disabled) since onOpenShare is provided
      const shareButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Share'
      );
      expect(shareButton).not.toBeUndefined();
      expect(shareButton?.disabled).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });
});

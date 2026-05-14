import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet
} from '@tanstack/react-router';

// Ensure i18n is initialized
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { albumPages, type AlbumPage, type StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';
import type { ViewerFilter } from '@/components/album-viewer/viewer-state';
import { AlbumRouteScreen } from '@/components/album-viewer/AlbumRouteScreen';

function createTestRouter(initialPath: string, testComponent: React.ReactNode) {
  const testRoot = createRootRoute({
    component: () => React.createElement(Outlet)
  });

  const albumRoute = createRoute({
    getParentRoute: () => testRoot,
    path: 'album'
  });

  const albumPageRoute = createRoute({
    getParentRoute: () => albumRoute,
    path: '$pageId'
  });

  const albumGroupPageRoute = createRoute({
    getParentRoute: () => albumRoute,
    path: '$group/$pageId'
  });

  const indexRoute = createRoute({
    getParentRoute: () => testRoot,
    path: '/',
    component: () => testComponent
  });

  const routeTree = testRoot.addChildren([
    indexRoute,
    albumRoute.addChildren([albumPageRoute, albumGroupPageRoute])
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialPath]
    })
  });
}

function mountWithRouter(
  child: React.ReactNode,
  initialPath = '/'
): { container: HTMLDivElement; root: Root; router: ReturnType<typeof createTestRouter> } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const router = createTestRouter(initialPath, child);
  const root = createRoot(container);
  root.render(React.createElement(RouterProvider, { router }));
  return { container, root, router };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

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

let testCounter = 0;

async function resetStorage() {
  testCounter++;
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  setDatabaseNameForTests(`test-albumroute-${testCounter}`);
}

function makeMockAppState(
  collection: Record<string, ReadonlySet<StickerIdentifier>> = {}
): NonNullable<React.ContextType<typeof AppStateContext>> {
  return {
    collection,
    renderState: 'ready',
    toggleCollected: async () => ({ state: 'ready' as const, value: collection }),
    bootstrap: async () => {},
    reset: async () => {}
  } as unknown as NonNullable<React.ContextType<typeof AppStateContext>>;
}

describe('AlbumRouteScreen', () => {
  const mexPage = albumPages.find((p) => p.pageId === 'mex') as AlbumPage;
  const openingPage = albumPages.find((p) => p.pageId === 'fwc-opening') as AlbumPage;

  it('renders AlbumViewer content when appState is ready', async () => {
    await resetStorage();

    const appState = makeMockAppState();

    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: appState },
        React.createElement(AlbumRouteScreen, {
          activePage: mexPage,
          activeFilter: 'all',
          onChangeFilter: () => {}
        })
      )
    );

    try {
      await waitFor(() => {
        const header = mounted.container.querySelector('header');
        return header !== null;
      });

      expect(mounted.container.querySelector('header')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('returns null when appState is null', async () => {
    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: null },
        React.createElement(AlbumRouteScreen, {
          activePage: mexPage,
          activeFilter: 'all',
          onChangeFilter: () => {}
        })
      )
    );

    try {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // No album viewer content rendered
      expect(mounted.container.querySelector('header')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders with special page', async () => {
    await resetStorage();

    const appState = makeMockAppState();

    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: appState },
        React.createElement(AlbumRouteScreen, {
          activePage: openingPage,
          activeFilter: 'all',
          onChangeFilter: () => {}
        })
      )
    );

    try {
      await waitFor(() => {
        const header = mounted.container.querySelector('header');
        return header !== null;
      });

      expect(mounted.container.querySelector('header')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('filter state changes are passed through onChangeFilter', async () => {
    await resetStorage();

    const appState = makeMockAppState();
    let capturedFilter: ViewerFilter = 'all';

    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: appState },
        React.createElement(AlbumRouteScreen, {
          activePage: mexPage,
          activeFilter: capturedFilter,
          onChangeFilter: (filter: ViewerFilter) => {
            capturedFilter = filter;
          }
        })
      )
    );

    try {
      await waitFor(() => {
        const pills = mounted.container.querySelectorAll('button[class*="filterPill"]');
        return pills.length === 3;
      });

      const pills = Array.from(mounted.container.querySelectorAll('button[class*="filterPill"]'));
      expect(pills).toHaveLength(3);

      // Click "collected" filter
      pills[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(capturedFilter).toBe('collected');

      // Click "missing" filter
      pills[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(capturedFilter).toBe('missing');
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates to /share with current-page payload from filter-row share button', async () => {
    await resetStorage();

    const appState = makeMockAppState();

    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: appState },
        React.createElement(AlbumRouteScreen, {
          activePage: mexPage,
          activeFilter: 'all',
          onChangeFilter: () => {}
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('button[class*="shareButton"]') !== null);

      const shareButton = mounted.container.querySelector<HTMLButtonElement>(
        'button[class*="shareButton"]'
      );
      shareButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => mounted.router.state.location.pathname === '/share');

      const searchParams = new URLSearchParams(mounted.router.state.location.search);
      expect(searchParams.get('pages')).toBe('mex');
      expect(searchParams.get('from')).toBe('/');
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates to /share with global payload from drawer share action', async () => {
    await resetStorage();

    const appState = makeMockAppState();

    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: appState },
        React.createElement(AlbumRouteScreen, {
          activePage: mexPage,
          activeFilter: 'all',
          onChangeFilter: () => {}
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('button[class*="menuButton"]') !== null);

      const menuButton = mounted.container.querySelector<HTMLButtonElement>(
        'button[class*="menuButton"]'
      );
      menuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      const shareDrawerButton = Array.from(document.body.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Share'
      );
      shareDrawerButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => mounted.router.state.location.pathname === '/share');

      const searchParams = new URLSearchParams(mounted.router.state.location.search);
      expect(searchParams.get('from')).toBe('/');
      expect(searchParams.get('pages')).toBeTruthy();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders with collection data', async () => {
    await resetStorage();

    const collection: Record<string, ReadonlySet<StickerIdentifier>> = {
      mex: new Set(['MEX-1' as StickerIdentifier, 'MEX-2' as StickerIdentifier])
    };
    const appState = makeMockAppState(collection);

    const mounted = mountWithRouter(
      React.createElement(
        AppStateContext.Provider,
        { value: appState },
        React.createElement(AlbumRouteScreen, {
          activePage: mexPage,
          activeFilter: 'all',
          onChangeFilter: () => {}
        })
      )
    );

    try {
      await waitFor(() => {
        const header = mounted.container.querySelector('header');
        return header !== null;
      });

      expect(mounted.container.querySelector('header')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

import { describe, expect, it, vi } from 'vitest';

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

import { AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { albumPages, type StickerIdentifier } from '@/data/album';
import type { ViewerFilter } from '@/components/album-viewer/viewer-state';
import { AlbumViewer } from '@/components/album-viewer/AlbumViewer';

// Build a minimal test route tree where the test component is rendered as the index route
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

  const albumIndexRoute = createRoute({
    getParentRoute: () => albumRoute,
    path: '/'
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
    albumRoute.addChildren([albumIndexRoute, albumPageRoute, albumGroupPageRoute])
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
): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const router = createTestRouter(initialPath, child);
  const root = createRoot(container);
  root.render(React.createElement(RouterProvider, { router }));
  return { container, root };
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
  setDatabaseNameForTests(`test-albumviewer-${testCounter}`);
}

describe('AlbumViewer', () => {
  describe('loading state', () => {
    it('renders loading skeleton while provider is still bootstrapping', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {},
        openDatabase: async () => {
          return new Promise(() => {});
        }
      });

      const teamPage = albumPages.find((p) => p.type === 'team')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page: teamPage,
            renderState: 'loading',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'all',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const loadingState = mounted.container.querySelector('[aria-busy="true"]');
          return loadingState !== null;
        });

        // Loading skeleton is visible
        const loadingState = mounted.container.querySelector('[aria-busy="true"]');
        expect(loadingState).not.toBeNull();
        expect(loadingState?.getAttribute('aria-live')).toBe('polite');

        // Loading cells are rendered (12 skeleton cells)
        const loadingCells = mounted.container.querySelectorAll('[class*="loadingCell"]');
        expect(loadingCells.length).toBe(12);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('team page header', () => {
    it('renders team page metadata with flag, name, and group badge', async () => {
      await resetStorage();

      const teamPage = albumPages.find((p) => p.type === 'team')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page: teamPage,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'all',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const header = mounted.container.querySelector('header');
          return header !== null;
        });

        const header = mounted.container.querySelector('header');
        expect(header).not.toBeNull();

        // Flag element is rendered (uses flag-icons class pattern)
        const flag = header?.querySelector('[class*="flag"]');
        expect(flag).not.toBeNull();

        // Team name text exists
        const teamName = header?.querySelector('[class*="teamName"]');
        expect(teamName).not.toBeNull();
        expect(teamName?.textContent).toBeTruthy();

        // Group badge exists
        const group = header?.querySelector('[class*="group"]');
        expect(group).not.toBeNull();
        expect(group?.textContent).toMatch(/Group [A-L]/);

        // Dot separator between name and group
        const dot = header?.querySelector('[class*="dot"]');
        expect(dot).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('special page header', () => {
    it('renders special page metadata with title and section label', async () => {
      await resetStorage();

      const specialPage = albumPages.find((p) => p.type === 'special')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page: specialPage,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'all',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const header = mounted.container.querySelector('header');
          return header !== null;
        });

        const header = mounted.container.querySelector('header');
        expect(header).not.toBeNull();

        // Special name text exists
        const specialName = header?.querySelector('[class*="specialName"]');
        expect(specialName).not.toBeNull();
        expect(specialName?.textContent).toBeTruthy();

        // Section label exists
        const group = header?.querySelector('[class*="group"]');
        expect(group).not.toBeNull();
        expect(group?.textContent).toBeTruthy();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('filter pills', () => {
    it('renders interactive filter pills with aria-pressed state and click handlers', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const onChangeFilter = vi.fn<(filter: ViewerFilter) => void>();

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'collected',
            onChangeFilter,
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelectorAll('button[class*="filterPill"]').length === 3
        );

        const pills = Array.from(mounted.container.querySelectorAll('button[class*="filterPill"]'));
        expect(pills).toHaveLength(3);

        for (const pill of pills) {
          expect(pill.hasAttribute('disabled')).toBe(false);
        }

        expect(pills[0]?.getAttribute('aria-pressed')).toBe('false');
        expect(pills[1]?.getAttribute('aria-pressed')).toBe('true');
        expect(pills[2]?.getAttribute('aria-pressed')).toBe('false');

        pills[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        pills[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(onChangeFilter).toHaveBeenNthCalledWith(1, 'all');
        expect(onChangeFilter).toHaveBeenNthCalledWith(2, 'missing');
      } finally {
        cleanup(mounted);
      }
    });

    it('renders share icon button and triggers callback', async () => {
      await resetStorage();

      const page = albumPages.find((candidate) => candidate.pageId === 'mex')!;
      const onOpenCurrentPageShare = vi.fn<() => void>();

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'all',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onOpenCurrentPageShare,
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[class*="shareButton"]') !== null
        );

        const shareButton = mounted.container.querySelector<HTMLButtonElement>(
          'button[class*="shareButton"]'
        );

        expect(shareButton).not.toBeNull();

        shareButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onOpenCurrentPageShare).toHaveBeenCalledTimes(1);
      } finally {
        cleanup(mounted);
      }
    });

    it('renders collected filter subset when active filter is collected', async () => {
      await resetStorage();

      const page = albumPages.find((candidate) => candidate.pageId === 'mex')!;
      const collectedStickerIds = new Set<StickerIdentifier>([
        page.stickerIds[0] as StickerIdentifier,
        page.stickerIds[2] as StickerIdentifier
      ]);

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page,
            renderState: 'ready',
            collectedStickerIds,
            activeFilter: 'collected',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(() => mounted.container.querySelectorAll('button[class*="cell"]').length > 0);
        expect(mounted.container.querySelectorAll('button[class*="cell"]').length).toBe(2);
      } finally {
        cleanup(mounted);
      }
    });

    it('renders missing filter subset when active filter is missing', async () => {
      await resetStorage();

      const page = albumPages.find((candidate) => candidate.pageId === 'mex')!;
      const collectedStickerIds = new Set<StickerIdentifier>([
        page.stickerIds[0] as StickerIdentifier,
        page.stickerIds[2] as StickerIdentifier
      ]);

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page,
            renderState: 'ready',
            collectedStickerIds,
            activeFilter: 'missing',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(() => mounted.container.querySelectorAll('button[class*="cell"]').length > 0);
        expect(mounted.container.querySelectorAll('button[class*="cell"]').length).toBe(
          page.stickerIds.length - collectedStickerIds.size
        );
      } finally {
        cleanup(mounted);
      }
    });

    it('renders translated empty state when filter has zero stickers', async () => {
      await resetStorage();

      const page = albumPages.find((candidate) => candidate.pageId === 'mex')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'collected',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(
          () =>
            mounted.container.textContent?.includes(
              'No stickers match this filter on this page.'
            ) ?? false
        );

        expect(mounted.container.textContent).toContain(
          'No stickers match this filter on this page.'
        );
        expect(mounted.container.querySelectorAll('button[aria-pressed]').length).toBe(3);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('swipe hint', () => {
    it('renders swipe hint visible in viewer', async () => {
      await resetStorage();

      const page = albumPages[0]!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'all',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const swipeHint = mounted.container.querySelector('[class*="swipeHint"]');
          return swipeHint !== null;
        });

        const swipeHint = mounted.container.querySelector('[class*="swipeHint"]');
        expect(swipeHint).not.toBeNull();
        expect(swipeHint?.textContent).toBeTruthy();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('full integration with router context', () => {
    it('renders AlbumViewer with router context and sticker cells after bootstrap', async () => {
      await resetStorage();

      const teamPage = albumPages.find((p) => p.type === 'team')!;

      const mounted = mountWithRouter(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(AlbumViewer, {
            page: teamPage,
            renderState: 'ready',
            collectedStickerIds: new Set<StickerIdentifier>(),
            activeFilter: 'all',
            onChangeFilter: () => {},
            onOpenQuickNavigation: () => {},
            onToggleSticker: () => {}
          })
        )
      );

      try {
        // Wait for AlbumViewer to render
        await waitFor(() => {
          const header = mounted.container.querySelector('header');
          return header !== null;
        });

        // Header is rendered
        const header = mounted.container.querySelector('header');
        expect(header).not.toBeNull();

        // Sticker cells rendered (aria-pressed buttons)
        const stickerButtons = mounted.container.querySelectorAll('button[aria-pressed]');
        expect(stickerButtons.length).toBeGreaterThan(0);

        // Swipe hint is rendered
        const swipeHint = mounted.container.querySelector('[class*="swipeHint"]');
        expect(swipeHint).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });
});

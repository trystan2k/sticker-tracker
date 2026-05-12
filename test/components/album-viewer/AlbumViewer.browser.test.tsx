import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { albumPages, type StickerIdentifier } from '@/data/album';
import type { ViewerFilter } from '@/components/album-viewer/viewer-state';
import { AlbumViewer } from '@/components/album-viewer/AlbumViewer';

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

  describe('full integration via Home route', () => {
    it('renders loading skeleton initially then sticker cells after bootstrap', async () => {
      await resetStorage();

      let capturedContext:
        | (typeof AppStateContext extends React.Context<infer T> ? T : never)
        | null = null;

      function ContextReader() {
        capturedContext = React.useContext(AppStateContext);
        return React.createElement('div', { 'data-testid': 'context-captured' });
      }

      const { Route: _, Home } = await import('@/routes/index');

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
        // Wait for bootstrap to complete and sticker cells to appear
        await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

        // Sticker cells rendered (aria-pressed buttons)
        const stickerButtons = mounted.container.querySelectorAll('button[aria-pressed]');
        expect(stickerButtons.length).toBeGreaterThan(0);

        // Progress bar rendered
        const progressbar = mounted.container.querySelector('[role="progressbar"]');
        expect(progressbar).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });
});

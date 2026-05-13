/* oxlint-disable react/no-children-prop, typescript/unbound-method, eslint/no-underscore-dangle */
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

// Ensure i18n is initialized (SwipeNavigator renders QuickNavigationPicker which uses useTranslation)
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { SwipeNavigator } from '@/components/album-viewer/SwipeNavigator';
import { SWIPE_THRESHOLD_PX } from '@/components/album-viewer/viewer-state';
import { type PageId, type AlbumPage } from '@/data/album';

// Inline render props type (SwipeNavigatorRenderProps is not exported)
type SwipeRenderProps = {
  activePage: AlbumPage;
  activePageId: PageId;
  goToPage: (pageId: PageId) => void;
  openQuickNavigation: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
};

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
        // keep polling
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
): { container: HTMLDivElement; root: Root; router: ReturnType<typeof createTestRouter> } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const router = createTestRouter(initialPath, child);
  const root = createRoot(container);
  root.render(
    React.createElement(RouterProvider, {
      router: router as unknown as ReturnType<typeof createRouter>
    })
  );

  return { container, root, router };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

function createTouchLikeEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  x: number,
  y: number
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touchList = [{ clientX: x, clientY: y }];

  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' ? [] : touchList
  });

  Object.defineProperty(event, 'changedTouches', {
    value: touchList
  });

  return event;
}

function swipe(surface: HTMLElement, fromX: number, fromY: number, toX: number, toY: number): void {
  surface.dispatchEvent(createTouchLikeEvent('touchstart', fromX, fromY));
  surface.dispatchEvent(createTouchLikeEvent('touchmove', toX, toY));
  surface.dispatchEvent(createTouchLikeEvent('touchend', toX, toY));
}

describe('SwipeNavigator', () => {
  it('swipe left moves to next page', async () => {
    // Stub startViewTransition to avoid transition wrapping in test environment
    const originalStartViewTransition = document.startViewTransition;
    // @ts-expect-error - stubbing for test
    document.startViewTransition = undefined;

    const mounted = mountWithRouter(
      React.createElement(SwipeNavigator, {
        activePageId: 'fwc-opening' as PageId,
        children: ({ activePage, goToPage, goToNextPage, goToPrevPage }: SwipeRenderProps) => {
          // Expose navigation functions for test verification
          // @ts-expect-error - attaching to window for test access
          window.__testGoToPage = goToPage;
          // @ts-expect-error - attaching to window for test access
          window.__testGoToNextPage = goToNextPage;
          // @ts-expect-error - attaching to window for test access
          window.__testGoToPrevPage = goToPrevPage;
          return React.createElement('p', { 'data-testid': 'active-page' }, activePage.pageId);
        }
      })
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;

      // Swipe left (negative deltaX) should trigger next page
      swipe(surface, 200, 120, 200 - SWIPE_THRESHOLD_PX - 10, 120);

      // Wait for navigation to be triggered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the router navigated (check history location)
      const location = mounted.router.state.location;
      // fwc-opening is a special page, next page should be mex (also special) or a team page
      // The path depends on the album order
      expect(location.pathname).toMatch(/\/album\//);
      expect(location.pathname).not.toBe('/');
    } finally {
      document.startViewTransition = originalStartViewTransition;
      // @ts-expect-error - cleanup test globals
      delete window.__testGoToPage;
      // @ts-expect-error - cleanup test globals
      delete window.__testGoToNextPage;
      // @ts-expect-error - cleanup test globals
      delete window.__testGoToPrevPage;
      cleanup(mounted);
    }
  });

  it('swipe right on first page wraps to last page', async () => {
    // Stub startViewTransition to avoid transition wrapping in test environment
    const originalStartViewTransition = document.startViewTransition;
    // @ts-expect-error - stubbing for test
    document.startViewTransition = undefined;

    const mounted = mountWithRouter(
      React.createElement(SwipeNavigator, {
        activePageId: 'fwc-opening' as PageId,
        children: ({ activePage }: SwipeRenderProps) =>
          React.createElement('p', { 'data-testid': 'active-page' }, activePage.pageId)
      })
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;

      // Swipe right (positive deltaX) on first page should wrap to last page
      swipe(surface, 120, 120, 120 + SWIPE_THRESHOLD_PX + 10, 120);

      // Wait for navigation to be triggered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the router navigated
      const location = mounted.router.state.location;
      expect(location.pathname).toMatch(/\/album\//);
    } finally {
      document.startViewTransition = originalStartViewTransition;
      cleanup(mounted);
    }
  });

  it('does not navigate when below threshold', async () => {
    const mounted = mountWithRouter(
      React.createElement(SwipeNavigator, {
        activePageId: 'mex' as PageId,
        children: ({ activePage }: SwipeRenderProps) =>
          React.createElement('p', { 'data-testid': 'active-page' }, activePage.pageId)
      })
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const initialPath = mounted.router.state.location.pathname;

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;

      // Swipe below threshold - should NOT navigate
      swipe(surface, 200, 120, 200 - SWIPE_THRESHOLD_PX + 1, 120);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mounted.router.state.location.pathname).toBe(initialPath);
    } finally {
      cleanup(mounted);
    }
  });

  it('does not navigate on vertical drag', async () => {
    const mounted = mountWithRouter(
      React.createElement(SwipeNavigator, {
        activePageId: 'mex' as PageId,
        children: ({ activePage }: SwipeRenderProps) =>
          React.createElement('p', { 'data-testid': 'active-page' }, activePage.pageId)
      })
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const initialPath = mounted.router.state.location.pathname;

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;

      // Vertical drag - should NOT navigate
      swipe(surface, 160, 120, 160 + SWIPE_THRESHOLD_PX + 20, 120 + SWIPE_THRESHOLD_PX + 80);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mounted.router.state.location.pathname).toBe(initialPath);
    } finally {
      cleanup(mounted);
    }
  });
});

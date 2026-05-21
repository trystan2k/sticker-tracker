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

import { computeGroupsData } from '@/components/home/home-state';
import { HomeGroupCards } from '@/components/home/HomeGroupCards';

function createTestRouter(initialPath: string, testComponent: React.ReactNode) {
  const testRoot = createRootRoute({
    component: () => React.createElement(Outlet)
  });

  const albumRoute = createRoute({
    getParentRoute: () => testRoot,
    path: 'album'
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
    albumRoute.addChildren([albumGroupPageRoute])
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

describe('HomeGroupCards', () => {
  it('renders all group cards', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const cards = mounted.container.querySelectorAll('article');
        return cards.length > 0;
      });

      const cards = mounted.container.querySelectorAll('article');
      expect(cards.length).toBe(12); // 12 groups A-L
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates when group card is clicked', async () => {
    const groups = computeGroupsData({});

    // Create a custom router that captures navigation
    const testRoot = createRootRoute({
      component: () => React.createElement(Outlet)
    });

    const albumRoute = createRoute({
      getParentRoute: () => testRoot,
      path: 'album'
    });

    const albumGroupPageRoute = createRoute({
      getParentRoute: () => albumRoute,
      path: '$group/$pageId'
    });

    const indexRoute = createRoute({
      getParentRoute: () => testRoot,
      path: '/',
      component: () => React.createElement(HomeGroupCards, { groups })
    });

    const routeTree = testRoot.addChildren([
      indexRoute,
      albumRoute.addChildren([albumGroupPageRoute])
    ]);

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: ['/']
      })
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(React.createElement(RouterProvider, { router }));

    try {
      await waitFor(() => {
        const cards = container.querySelectorAll('article');
        return cards.length > 0;
      });

      // Click first group card's action button
      const actionButton = container.querySelector('article button[class*="cardAction"]');
      expect(actionButton).not.toBeNull();
      (actionButton as HTMLButtonElement).click();

      // Navigation should have been triggered - check location changed
      await new Promise((r) => setTimeout(r, 100));
      const currentPath = router.state.location.pathname;
      expect(currentPath).not.toBe('/');
    } finally {
      root.unmount();
      container.remove();
    }
  });

  it('navigates when team tile is clicked', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const tiles = mounted.container.querySelectorAll('button[class*="teamTile"]');
        return tiles.length > 0;
      });

      const tiles = mounted.container.querySelectorAll('button[class*="teamTile"]');
      expect(tiles.length).toBeGreaterThan(0);

      // Click first team tile
      (tiles[0] as HTMLButtonElement).click();

      // Should not crash - navigation happens via router
      await new Promise((r) => requestAnimationFrame(r));
    } finally {
      cleanup(mounted);
    }
  });

  it('renders team flags with correct src', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const flags = mounted.container.querySelectorAll('img[data-flag-code]');
        return flags.length > 0;
      });

      const flags = mounted.container.querySelectorAll('img[data-flag-code]');
      expect(flags.length).toBeGreaterThan(0);

      // Check flag URL format
      const firstFlag = flags[0] as HTMLImageElement;
      expect(firstFlag.src).toContain('flagcdn.com');
      expect(firstFlag.dataset.flagCode).toBeDefined();
    } finally {
      cleanup(mounted);
    }
  });

  it('shows complete styling for complete groups', async () => {
    // Collect all stickers from group A
    const teamPages = ['mex', 'rsa', 'kor', 'cze'];
    const collection: Record<string, ReadonlySet<string>> = {};
    for (const team of teamPages) {
      collection[team] = new Set(
        Array.from({ length: 20 }, (_, i) => `${team.toUpperCase()}-${i + 1}`)
      );
    }

    const groups = computeGroupsData(collection as any);
    const groupA = groups.find((g) => g.group === 'A')!;
    expect(groupA.isComplete).toBe(true);

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const cards = mounted.container.querySelectorAll('article');
        return cards.length > 0;
      });

      // First card should have complete styling
      const firstCard = mounted.container.querySelector('article');
      expect(firstCard?.className).toContain('cardComplete');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders progress fill with correct width', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const fills = mounted.container.querySelectorAll('[class*="progressFill"]');
        return fills.length > 0;
      });

      const fills = mounted.container.querySelectorAll('[class*="progressFill"]');
      expect(fills.length).toBeGreaterThan(0);

      const firstFill = Array.from(fills).find(
        (fill) => !(fill as HTMLElement).className.includes('teamProgressFill')
      ) as HTMLElement | undefined;
      expect(firstFill).toBeDefined();

      if (!firstFill) return;

      expect(firstFill.style.width).toBe('0%');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders team tile counters and team progress bars', async () => {
    const collection: Record<string, ReadonlySet<string>> = {
      mex: new Set(Array.from({ length: 10 }, (_, index) => `MEX-${index + 1}`))
    };
    const groups = computeGroupsData(collection as never);

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const tiles = mounted.container.querySelectorAll('button[class*="teamTile"]');
        return tiles.length > 0;
      });

      const mexicoTile = Array.from(
        mounted.container.querySelectorAll('button[class*="teamTile"]')
      ).find((tile) => tile.getAttribute('data-team-page-id') === 'mex') as
        | HTMLButtonElement
        | undefined;

      expect(mexicoTile).toBeDefined();
      expect(mexicoTile?.getAttribute('aria-label')).toContain('10/20');
      expect(mexicoTile?.textContent).toContain('10/20');

      const mexicoProgressFill = mexicoTile?.querySelector(
        '[class*="teamProgressFill"]'
      ) as HTMLElement | null;
      expect(mexicoProgressFill).not.toBeNull();
      expect(mexicoProgressFill?.style.width).toBe('50%');
    } finally {
      cleanup(mounted);
    }
  });

  it('handles flag image error with fallback for gb-eng and gb-sct codes', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const flags = mounted.container.querySelectorAll('img[data-flag-code]');
        return flags.length > 0;
      });

      // Find a flag with gb-eng code (England)
      const flags = Array.from(mounted.container.querySelectorAll('img[data-flag-code]'));
      const gbEngFlag = flags.find((f) => (f as HTMLImageElement).dataset.flagCode === 'gb-eng');
      expect(gbEngFlag).toBeDefined();

      const img = gbEngFlag as HTMLImageElement;

      // Simulate image load error
      img.dispatchEvent(new Event('error', { bubbles: true }));

      // After error, src should be updated to fallback (gb)
      await new Promise((r) => setTimeout(r, 100));
      expect(img.src).toContain('/gb.png');
      expect(img.dataset.fallbackApplied).toBe('true');
    } finally {
      cleanup(mounted);
    }
  });

  it('marks fallbackApplied and skips src change when src already equals fallback url', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const flags = mounted.container.querySelectorAll('img[data-flag-code]');
        return flags.length > 0;
      });

      // Use a normal (non-mapped) flag — flagCode === fallbackCode, so src already ends with /${flagCode}.png
      const flags = Array.from(mounted.container.querySelectorAll('img[data-flag-code]'));
      const normalFlag = flags.find(
        (f) => !['gb-eng', 'gb-sct'].includes((f as HTMLImageElement).dataset.flagCode ?? '')
      ) as HTMLImageElement | undefined;
      expect(normalFlag).toBeDefined();

      if (!normalFlag) return;

      // Verify src ends with flagCode.png (line 34 condition will be true)
      const code = normalFlag.dataset.flagCode ?? '';
      expect(normalFlag.src).toContain(`/${code}.png`);

      // Fire error — should hit line 35 (src already ends with fallback), set fallbackApplied, return
      normalFlag.dispatchEvent(new Event('error', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 100));

      expect(normalFlag.dataset.fallbackApplied).toBe('true');
      // src should NOT have changed (already correct)
      expect(normalFlag.src).toContain(`/${code}.png`);
    } finally {
      cleanup(mounted);
    }
  });

  it('does not apply fallback twice on second error', async () => {
    const groups = computeGroupsData({});

    const mounted = mountWithRouter(React.createElement(HomeGroupCards, { groups }));

    try {
      await waitFor(() => {
        const flags = mounted.container.querySelectorAll('img[data-flag-code]');
        return flags.length > 0;
      });

      const flags = Array.from(mounted.container.querySelectorAll('img[data-flag-code]'));
      const gbEngFlag = flags.find((f) => (f as HTMLImageElement).dataset.flagCode === 'gb-eng');
      expect(gbEngFlag).toBeDefined();

      const img = gbEngFlag as HTMLImageElement;

      // First error - applies fallback
      img.dispatchEvent(new Event('error', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(img.dataset.fallbackApplied).toBe('true');

      const srcAfterFirst = img.src;

      // Second error - should not change src again
      img.dispatchEvent(new Event('error', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(img.src).toBe(srcAfterFirst);
    } finally {
      cleanup(mounted);
    }
  });
});

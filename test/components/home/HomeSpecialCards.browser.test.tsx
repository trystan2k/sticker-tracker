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

import { computeSpecialPagesData } from '@/components/home/home-state';
import { HomeSpecialCards } from '@/components/home/HomeSpecialCards';

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

  const indexRoute = createRoute({
    getParentRoute: () => testRoot,
    path: '/',
    component: () => testComponent
  });

  const routeTree = testRoot.addChildren([indexRoute, albumRoute.addChildren([albumPageRoute])]);

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

describe('HomeSpecialCards', () => {
  it('renders all special cards', async () => {
    const cards = computeSpecialPagesData({});

    const mounted = mountWithRouter(React.createElement(HomeSpecialCards, { cards }));

    try {
      await waitFor(() => {
        const articles = mounted.container.querySelectorAll('article');
        return articles.length > 0;
      });

      const articles = mounted.container.querySelectorAll('article');
      expect(articles.length).toBe(3); // fwc-opening, fwc-closing, coca-cola
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates when special card is clicked', async () => {
    const cards = computeSpecialPagesData({});

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

    const indexRoute = createRoute({
      getParentRoute: () => testRoot,
      path: '/',
      component: () => React.createElement(HomeSpecialCards, { cards })
    });

    const routeTree = testRoot.addChildren([indexRoute, albumRoute.addChildren([albumPageRoute])]);

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
        const articles = container.querySelectorAll('article');
        return articles.length > 0;
      });

      // Click first special card's action button
      const actionButton = container.querySelector('article button[class*="cardAction"]');
      expect(actionButton).not.toBeNull();
      (actionButton as HTMLButtonElement).click();

      // Navigation should have been triggered
      await new Promise((r) => setTimeout(r, 100));
      const currentPath = router.state.location.pathname;
      expect(currentPath).not.toBe('/');
    } finally {
      root.unmount();
      container.remove();
    }
  });

  it('applies coca-cola accent color', async () => {
    const cards = computeSpecialPagesData({});

    const mounted = mountWithRouter(React.createElement(HomeSpecialCards, { cards }));

    try {
      await waitFor(() => {
        const articles = mounted.container.querySelectorAll('article');
        return articles.length > 0;
      });

      const articles = mounted.container.querySelectorAll('article');
      // Find coca-cola card by its text content
      const cocaArticle = Array.from(articles).find((article) => {
        const text = article.textContent;
        return text?.includes('Coca-Cola') || text?.includes('coca-cola');
      });
      expect(cocaArticle).not.toBeNull();

      // Verify the coca-cola card has the correct accent color
      const cocaStyle = (cocaArticle as HTMLElement).style;
      expect(cocaStyle.getPropertyValue('--special-card-accent')).toBe(
        'var(--color-brand-sponsor-coca-cola, #CC0000)'
      );

      // Verify other cards have a different accent (default primary)
      const otherArticles = Array.from(articles).filter((a) => a !== cocaArticle);
      for (const other of otherArticles) {
        const otherStyle = other.style;
        expect(otherStyle.getPropertyValue('--special-card-accent')).toBe(
          'var(--color-brand-primary)'
        );
      }
    } finally {
      cleanup(mounted);
    }
  });

  it('shows complete styling for complete special pages', async () => {
    // Collect all fwc-opening stickers
    const collection: Record<string, ReadonlySet<string>> = {
      'fwc-opening': new Set(['00', '1', '2', '3', '4', '5', '6', '7', '8'])
    };

    const cards = computeSpecialPagesData(collection as any);
    const openingCard = cards.find((c) => c.key === 'fwc-opening')!;
    expect(openingCard.isComplete).toBe(true);

    const mounted = mountWithRouter(React.createElement(HomeSpecialCards, { cards }));

    try {
      await waitFor(() => {
        const articles = mounted.container.querySelectorAll('article');
        return articles.length > 0;
      });

      // Opening card should have complete styling
      const articles = mounted.container.querySelectorAll('article');
      const openingArticle = Array.from(articles).find((article) => {
        const text = article.textContent;
        return text?.includes('Opening') || text?.includes('opening');
      });
      expect(openingArticle?.className).toContain('cardComplete');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders progress fill with correct width', async () => {
    const cards = computeSpecialPagesData({});

    const mounted = mountWithRouter(React.createElement(HomeSpecialCards, { cards }));

    try {
      await waitFor(() => {
        const fills = mounted.container.querySelectorAll('[class*="progressFill"]');
        return fills.length > 0;
      });

      const fills = mounted.container.querySelectorAll('[class*="progressFill"]');
      expect(fills.length).toBe(3);

      // All fills should have 0% width for empty collection
      for (const fill of fills) {
        expect((fill as HTMLElement).style.width).toBe('0%');
      }
    } finally {
      cleanup(mounted);
    }
  });
});

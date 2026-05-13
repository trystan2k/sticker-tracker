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

import { AppStateProvider } from '@/providers/AppStateProvider';
import { QuickNavigationPicker } from '@/components/album-viewer/QuickNavigationPicker';
import { type PageId } from '@/data/album';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

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

let testCounter = 0;

async function resetStorage() {
  testCounter++;
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  setDatabaseNameForTests(`test-quick-nav-${testCounter}`);
}

describe('QuickNavigationPicker', () => {
  it('opens and closes after selecting a row', async () => {
    await resetStorage();

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose: () => {}
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const row = mounted.container.querySelector(
        '[data-page-id="coca-cola"]'
      ) as HTMLButtonElement;
      expect(row).not.toBeNull();
      row.click();

      await waitFor(() => mounted.container.querySelector('[role="dialog"]') === null);
      expect(mounted.container.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

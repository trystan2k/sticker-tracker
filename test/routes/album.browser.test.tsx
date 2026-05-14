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

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';
import { Route as AlbumRoute, useAlbumRouteContext } from '@/routes/album';

function createTestRouter(testComponent: React.ReactNode) {
  const testRoot = createRootRoute({
    component: () => React.createElement(Outlet)
  });

  const albumRoute = createRoute({
    getParentRoute: () => testRoot,
    path: 'album',
    component: () => testComponent
  });

  const routeTree = testRoot.addChildren([albumRoute]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/album']
    })
  });
}

function mountWithRouter(child: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const router = createTestRouter(child);
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

let testCounter = 0;

async function resetStorage() {
  testCounter++;
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  setDatabaseNameForTests(`test-album-${testCounter}`);
}

describe('album route', () => {
  describe('Route configuration', () => {
    it('route is defined with component', () => {
      expect(AlbumRoute.options.component).toBeTypeOf('function');
    });
  });

  it('useAlbumRouteContext returns activeFilter and onChangeFilter', async () => {
    await resetStorage();

    let capturedContext: ReturnType<typeof useAlbumRouteContext> | null = null;

    function ContextReader() {
      capturedContext = useAlbumRouteContext();
      return React.createElement('div', { 'data-testid': 'context' });
    }

    const mounted = mountWithRouter(
      React.createElement(AppStateProvider, null, React.createElement(ContextReader))
    );

    try {
      await waitFor(() => capturedContext !== null);

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.activeFilter).toBe('all');
      expect(capturedContext!.onChangeFilter).toBeTypeOf('function');
    } finally {
      cleanup(mounted);
    }
  });

  it('onChangeFilter updates activeFilter', async () => {
    await resetStorage();

    let capturedContext: ReturnType<typeof useAlbumRouteContext> | null = null;

    function ContextReader() {
      capturedContext = useAlbumRouteContext();
      return React.createElement('div', {
        'data-testid': 'context',
        'data-filter': capturedContext?.activeFilter
      });
    }

    const mounted = mountWithRouter(
      React.createElement(AppStateProvider, null, React.createElement(ContextReader))
    );

    try {
      await waitFor(() => capturedContext !== null);

      expect(capturedContext!.activeFilter).toBe('all');

      capturedContext!.onChangeFilter('missing');

      // React needs a re-render to pick up the new value
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      expect(capturedContext!.activeFilter).toBe('missing');
    } finally {
      cleanup(mounted);
    }
  });
});

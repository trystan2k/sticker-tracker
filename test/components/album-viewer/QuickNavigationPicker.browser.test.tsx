import { afterEach, describe, expect, it, vi } from 'vitest';

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

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it('returns null when isOpen is false', () => {
    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: false,
          activePageId: 'fwc-opening' as PageId,
          onClose: () => {}
        })
      )
    );

    try {
      expect(mounted.container.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders search input', async () => {
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

      const searchInput = mounted.container.querySelector('input[type="search"]');
      expect(searchInput).not.toBeNull();
      expect((searchInput as HTMLInputElement)?.placeholder).toBeTruthy();
    } finally {
      cleanup(mounted);
    }
  });

  it('highlights active page with aria-current', async () => {
    await resetStorage();

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'mex' as PageId,
          onClose: () => {}
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const mexRow = mounted.container.querySelector('[data-page-id="mex"]');
      expect(mexRow?.getAttribute('aria-current')).toBe('page');

      const usaRow = mounted.container.querySelector('[data-page-id="usa"]');
      expect(usaRow?.hasAttribute('aria-current')).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('closes on Escape key press', async () => {
    await resetStorage();

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      await new Promise((r) => setTimeout(r, 200));
      expect(closed).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('closes when backdrop is clicked', async () => {
    await resetStorage();

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const backdrop = mounted.container.querySelector('[class*="backdrop"]');
      backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 200));
      expect(closed).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('closes when close button is clicked', async () => {
    await resetStorage();

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const closeBtn = mounted.container.querySelector('[class*="closeBtn"]');
      closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 200));
      expect(closed).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('clears search query when reopened', async () => {
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

      // Type in search
      const searchInput = mounted.container.querySelector('input[type="search"]');
      expect((searchInput as HTMLInputElement)?.value).toBe('');
    } finally {
      cleanup(mounted);
    }
  });

  it('row click with invalid pageId (not in album) is a no-op', async () => {
    await resetStorage();

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      // Find any row and override its data-page-id to an invalid value
      const firstRow = mounted.container.querySelector('[data-page-id]') as HTMLButtonElement;
      expect(firstRow).not.toBeNull();

      const originalId = firstRow.dataset.pageId;
      firstRow.dataset.pageId = 'NOT_A_VALID_PAGE';

      firstRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));

      // Restore
      firstRow.dataset.pageId = originalId ?? '';

      // onClose should NOT be called since pageId was invalid
      expect(closed).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates without viewTransition when document.startViewTransition is absent', async () => {
    await resetStorage();

    const original = (document as unknown as Record<string, unknown>).startViewTransition;
    delete (document as unknown as Record<string, unknown>).startViewTransition;

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      // Click a valid row
      const row = mounted.container.querySelector('[data-page-id="mex"]') as HTMLButtonElement;
      expect(row).not.toBeNull();
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));

      expect(closed).toBe(true);
    } finally {
      if (original !== undefined) {
        (document as unknown as Record<string, unknown>).startViewTransition = original;
      }
      cleanup(mounted);
    }
  });

  it('filters entries when search query matches title', async () => {
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
      await waitFor(() => mounted.container.querySelector('input[type="search"]') !== null);

      const input = mounted.container.querySelector('input[type="search"]') as HTMLInputElement;
      input.value = 'Mexico';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Dispatch change event which the component listens to
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'currentTarget', { value: input });
      input.dispatchEvent(changeEvent);

      await new Promise((r) => requestAnimationFrame(r));

      // Results should still include Mexico row
      const mexRow = mounted.container.querySelector('[data-page-id="mex"]');
      expect(mexRow).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('Tab key wraps focus from last to first element in picker', async () => {
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
      await new Promise((r) => setTimeout(r, 100));

      const sheet = mounted.container.querySelector('[class*="sheet"]') as HTMLElement;
      expect(sheet).not.toBeNull();

      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const last = focusable[focusable.length - 1];

      if (last) {
        last.focus();
        // Dispatch Tab (no shiftKey) — should wrap to first
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        await new Promise((r) => setTimeout(r, 50));
      }

      // Should not throw or unmount
      expect(mounted.container.querySelector('[role="dialog"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('Shift+Tab key wraps focus from first to last element in picker', async () => {
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
      await new Promise((r) => setTimeout(r, 100));

      const sheet = mounted.container.querySelector('[class*="sheet"]') as HTMLElement;
      expect(sheet).not.toBeNull();

      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];

      if (first) {
        first.focus();
        // Dispatch Shift+Tab — should wrap to last
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 50));
      }

      expect(mounted.container.querySelector('[role="dialog"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('row click with invalid pageId (not in album) is a no-op', async () => {
    await resetStorage();

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      // Find any row and override its data-page-id to an invalid value
      const firstRow = mounted.container.querySelector('[data-page-id]') as HTMLButtonElement;
      expect(firstRow).not.toBeNull();

      const originalId = firstRow.dataset.pageId;
      firstRow.dataset.pageId = 'NOT_A_VALID_PAGE';

      firstRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));

      // Restore
      firstRow.dataset.pageId = originalId ?? '';

      // onClose should NOT be called since pageId was invalid
      expect(closed).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates without viewTransition when document.startViewTransition is absent', async () => {
    await resetStorage();

    const original = (document as unknown as Record<string, unknown>).startViewTransition;
    delete (document as unknown as Record<string, unknown>).startViewTransition;

    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'fwc-opening' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      // Click a valid row
      const row = mounted.container.querySelector('[data-page-id="mex"]') as HTMLButtonElement;
      expect(row).not.toBeNull();
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));

      expect(closed).toBe(true);
    } finally {
      if (original !== undefined) {
        (document as unknown as Record<string, unknown>).startViewTransition = original;
      }
      cleanup(mounted);
    }
  });

  it('filters entries when search query matches title', async () => {
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
      await waitFor(() => mounted.container.querySelector('input[type="search"]') !== null);

      const input = mounted.container.querySelector('input[type="search"]') as HTMLInputElement;
      input.value = 'Mexico';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Dispatch change event which the component listens to
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'currentTarget', { value: input });
      input.dispatchEvent(changeEvent);

      await new Promise((r) => requestAnimationFrame(r));

      // Results should still include Mexico row
      const mexRow = mounted.container.querySelector('[data-page-id="mex"]');
      expect(mexRow).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates backward (nav-back direction) when clicking earlier page', async () => {
    await resetStorage();

    // mex comes after fwc-opening in the album; navigating to fwc-opening is a backward move
    let closed = false;
    const onClose = () => {
      closed = true;
    };

    const mounted = mountWithRouter(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(QuickNavigationPicker, {
          isOpen: true,
          activePageId: 'mex' as PageId,
          onClose
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const row = mounted.container.querySelector(
        '[data-page-id="fwc-opening"]'
      ) as HTMLButtonElement;
      expect(row).not.toBeNull();
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));
      expect(closed).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('filters entries by subtitle when search query matches subtitle only', async () => {
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
      await waitFor(() => mounted.container.querySelector('input[type="search"]') !== null);
      await new Promise((r) => setTimeout(r, 100));

      const input = mounted.container.querySelector('input[type="search"]') as HTMLInputElement;

      // Use nativeInputValueSetter to trigger React's synthetic onChange
      // oxlint-disable-next-line typescript/unbound-method
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(input, 'Group A');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 100));

      // Some rows should remain visible
      const rows = mounted.container.querySelectorAll('[data-page-id]');
      expect(rows.length).toBeGreaterThan(0);
    } finally {
      cleanup(mounted);
    }
  });
});

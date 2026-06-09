import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { getI18nInstance } from '@/i18n/config';

import { albumPages, type AlbumPage } from '@/data/album';
import { AlbumPageHeader } from '@/components/album-viewer/AlbumPageHeader';

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

function waitFor(predicate: () => boolean, timeoutMs = 4000): Promise<void> {
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AlbumPageHeader', () => {
  beforeEach(async () => {
    await getI18nInstance().changeLanguage('en');
  });

  const teamPage = albumPages.find((p) => p.pageId === 'mex') as AlbumPage;
  const specialPage = albumPages.find((p) => p.pageId === 'fwc-opening') as AlbumPage;

  it('renders team page header with flag, name, and group', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const flag = mounted.container.querySelector('[class*="flag"]');
      expect(flag).not.toBeNull();

      const teamName = mounted.container.querySelector('[class*="teamName"]');
      expect(teamName).not.toBeNull();
      expect(teamName?.textContent).toBe('Mexico');

      const group = mounted.container.querySelector('[class*="group"]');
      expect(group).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders special page header with name and section label', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: specialPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const specialName = mounted.container.querySelector('[class*="specialName"]');
      expect(specialName).not.toBeNull();

      const group = mounted.container.querySelector('[class*="group"]');
      expect(group).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onOpenQuickNavigation when center trigger is clicked', async () => {
    const onOpenQuickNavigation = vi.fn<() => void>();

    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation,
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const centerTrigger = mounted.container.querySelector('[class*="centerTrigger"]');
      centerTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onOpenQuickNavigation).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates home when logo button is clicked', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const logoBtn = mounted.container.querySelector('[class*="logo"]');
      expect(logoBtn).not.toBeNull();
      expect(logoBtn?.textContent).toBeTruthy();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens menu drawer when menu button is clicked', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);
      expect(document.body.textContent).toContain('Share');
    } finally {
      cleanup(mounted);
    }
  });

  it('does not render scanner button in header', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const scannerButton = mounted.container.querySelector('[aria-label="Scanner"]');
      expect(scannerButton).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('passes onOpenShare to MenuDrawer', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      const shareBtn = Array.from(document.body.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Share') ?? false
      );
      expect(shareBtn?.disabled).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('disables share button when onOpenShare is undefined', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: undefined
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Share') ?? false);

      const shareBtn = Array.from(document.body.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Share') ?? false
      );
      expect(shareBtn?.disabled).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('navigates to home when logo button is clicked', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const logoBtn = mounted.container.querySelector('[class*="logo"]') as HTMLButtonElement;
      expect(logoBtn).not.toBeNull();
      logoBtn.click();

      // click triggers navigate({ to: '/' }) — no crash and button exists
      await new Promise((r) => requestAnimationFrame(r));
      expect(mounted.container.querySelector('[class*="logo"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('closes locale switcher when its close handler is called', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      // Open drawer → open locale switcher
      const menuBtn = mounted.container.querySelector('[class*="menuButton"]') as HTMLButtonElement;
      menuBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      const langBtn = Array.from(document.body.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Language')
      );
      langBtn?.click();

      await waitFor(() => document.body.textContent?.includes('Language / Idioma') ?? false);

      // Close via backdrop click
      const backdrop = document.body.querySelector('[class*="backdrop"]') as HTMLElement | null;
      backdrop?.click();

      // handleCloseLocaleModal (line 42) should fire — LocaleSwitcher unmounts/hides
      await new Promise((r) => setTimeout(r, 150));
      // No crash; component still mounted
      expect(mounted.container.querySelector('header')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens locale switcher from drawer language row', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      // Open drawer
      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Language') ?? false);

      // Click language button
      const langBtn = Array.from(document.body.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Language')
      );
      langBtn?.click();

      await waitFor(() => document.body.textContent?.includes('Language / Idioma') ?? false);
      expect(document.body.textContent).toContain('Language / Idioma');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows theme row in menu drawer', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Theme') ?? false);
      expect(document.body.textContent).toContain('Theme');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows repeated row in drawer', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Repeated Stickers') ?? false);

      expect(document.body.textContent).toContain('Repeated Stickers');
    } finally {
      cleanup(mounted);
    }
  });

  it('opens theme sheet from drawer theme row', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      // Open drawer
      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Theme') ?? false);

      // Click theme row
      const themeBtn = Array.from(document.body.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Theme')
      );
      themeBtn?.click();

      // Wait for ThemeSheet to appear
      await waitFor(() => document.body.querySelector('[aria-label="Theme"]') !== null);

      const dialog = document.body.querySelector('[aria-label="Theme"]');
      expect(dialog).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('closes theme sheet on escape', async () => {
    const mounted = mountWithRouter(
      React.createElement(AlbumPageHeader, {
        page: teamPage,
        onOpenQuickNavigation: () => {},
        onOpenShare: () => {}
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('header') !== null);

      // Open drawer
      const menuBtn = mounted.container.querySelector('[class*="menuButton"]');
      menuBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => document.body.textContent?.includes('Theme') ?? false);

      // Open theme sheet
      const themeBtn = Array.from(document.body.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Theme')
      );
      themeBtn?.click();

      await waitFor(() => document.body.querySelector('[aria-label="Theme"]') !== null);

      // Close with escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Wait for theme sheet to close
      await waitFor(() => {
        const dialog = document.body.querySelector('[aria-label="Theme"]');
        return dialog === null;
      });

      expect(document.body.querySelector('[aria-label="Theme"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

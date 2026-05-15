import { describe, expect, it } from 'vitest';

import { Route, RootLanguageSync } from '@/routes/__root';

describe('__root route', () => {
  describe('Route configuration', () => {
    it('head function is defined', () => {
      expect(Route.options.head).toBeTypeOf('function');
    });

    it('head returns links with favicon, manifest and apple touch icon', () => {
      const headFn = Route.options.head as
        | (() => { links: unknown[]; meta: unknown[] })
        | undefined;
      const head = headFn?.();

      expect(head?.links).toBeDefined();
      expect(head?.links).toHaveLength(3);
      expect(head?.links[0]).toEqual({ rel: 'icon', href: '/favicon.ico' });
      expect(head?.links[1]).toEqual({ rel: 'manifest', href: '/manifest.json' });
      expect(head?.links[2]).toEqual({ rel: 'apple-touch-icon', href: '/logo192.png' });
    });

    it('head returns meta with charset, viewport, title, description, theme-color', () => {
      const headFn = Route.options.head as
        | (() => { links: unknown[]; meta: unknown[] })
        | undefined;
      const head = headFn?.();

      expect(head?.meta).toBeDefined();
      expect(head?.meta).toHaveLength(5);

      const meta = head!.meta;
      expect(meta[0]).toEqual({ charSet: 'utf-8' });
      expect(meta[1]).toEqual({ name: 'viewport', content: 'width=device-width, initial-scale=1' });
      expect(meta[2]).toEqual({ title: 'Sticker Tracker' });
      expect(meta[3]).toEqual({
        name: 'description',
        content: 'Track your COPA 26 sticker album progress'
      });
      expect(meta[4]).toEqual({ name: 'theme-color', content: 'var(--color-brand-primary)' });
    });

    it('notFoundComponent is defined', () => {
      const routeOptions = Route.options as { notFoundComponent?: unknown };
      expect(routeOptions.notFoundComponent).toBeTypeOf('function');
    });

    it('shellComponent is defined', () => {
      const routeOptions = Route.options as { shellComponent?: unknown };
      expect(routeOptions.shellComponent).toBeTypeOf('function');
    });
  });

  describe('RootLanguageSync', () => {
    it('component is defined as a function', () => {
      expect(RootLanguageSync).toBeTypeOf('function');
    });
  });
});

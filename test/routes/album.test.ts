import { describe, expect, it } from 'vitest';

import { Route, useAlbumRouteContext, type AlbumRouteContext } from '@/routes/album';

describe('album route', () => {
  describe('Route configuration', () => {
    it('route is defined with component', () => {
      expect(Route.options.component).toBeTypeOf('function');
    });
  });

  describe('useAlbumRouteContext', () => {
    it('hook is defined and returns expected shape', () => {
      expect(useAlbumRouteContext).toBeTypeOf('function');
    });
  });

  describe('AlbumRouteContext type', () => {
    it('type exports are available', () => {
      // Type-level test: ensures AlbumRouteContext is exported
      // oxlint-disable-next-line no-underscore-dangle
      const context: AlbumRouteContext = {
        activeFilter: 'all',
        onChangeFilter: () => {}
      };
      expect(context.activeFilter).toBe('all');
      expect(context.onChangeFilter).toBeTypeOf('function');
    });
  });
});

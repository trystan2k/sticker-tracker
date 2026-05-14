import { describe, expect, it } from 'vitest';

import { Route as AlbumPageIdRoute } from '@/routes/album/$pageId';

describe('album/$pageId route', () => {
  it('route is defined with beforeLoad and component', () => {
    expect(AlbumPageIdRoute.options.beforeLoad).toBeTypeOf('function');
    expect(AlbumPageIdRoute.options.component).toBeTypeOf('function');
  });

  it('beforeLoad throws notFound for invalid pageId', () => {
    const beforeLoad = AlbumPageIdRoute.options.beforeLoad as
      | ((ctx: { params: { pageId: string } }) => void)
      | undefined;

    const callBeforeLoad = () => beforeLoad?.({ params: { pageId: 'invalid-page' } });
    // oxlint-disable-next-line vitest/require-to-throw-message
    expect(callBeforeLoad).toThrow();
  });

  it('beforeLoad does not throw for valid pageId', () => {
    const beforeLoad = AlbumPageIdRoute.options.beforeLoad as
      | ((ctx: { params: { pageId: string } }) => void)
      | undefined;

    // 'fwc-opening' is a valid special page ID
    expect(() => beforeLoad?.({ params: { pageId: 'fwc-opening' } })).not.toThrow();
  });
});

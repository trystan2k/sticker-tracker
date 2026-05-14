import { describe, expect, it } from 'vitest';

import { Route as AlbumGroupPageIdRoute } from '@/routes/album/$group/$pageId';

describe('album/$group/$pageId route', () => {
  it('route is defined with beforeLoad and component', () => {
    expect(AlbumGroupPageIdRoute.options.beforeLoad).toBeTypeOf('function');
    expect(AlbumGroupPageIdRoute.options.component).toBeTypeOf('function');
  });

  it('beforeLoad throws notFound for invalid group+pageId', () => {
    const beforeLoad = AlbumGroupPageIdRoute.options.beforeLoad as
      | ((ctx: { params: { group: string; pageId: string } }) => void)
      | undefined;

    const callBeforeLoad = () => beforeLoad?.({ params: { group: 'invalid', pageId: 'invalid' } });
    // oxlint-disable-next-line vitest/require-to-throw-message
    expect(callBeforeLoad).toThrow();
  });

  it('beforeLoad does not throw for valid group+pageId', () => {
    const beforeLoad = AlbumGroupPageIdRoute.options.beforeLoad as
      | ((ctx: { params: { group: string; pageId: string } }) => void)
      | undefined;

    // 'A' is a valid group, 'mex' is a valid page
    expect(() => beforeLoad?.({ params: { group: 'A', pageId: 'mex' } })).not.toThrow();
  });
});

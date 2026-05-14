import { describe, expect, it } from 'vitest';

import { Route as AlbumIndexRoute } from '@/routes/album/index';

describe('album/index route', () => {
  it('route is defined with beforeLoad', () => {
    expect(AlbumIndexRoute.options.beforeLoad).toBeTypeOf('function');
  });

  it('beforeLoad throws redirect', () => {
    const beforeLoad = AlbumIndexRoute.options.beforeLoad as (() => never) | undefined;

    const callBeforeLoad = () => beforeLoad?.();
    // oxlint-disable-next-line vitest/require-to-throw-message
    expect(callBeforeLoad).toThrow();
  });
});

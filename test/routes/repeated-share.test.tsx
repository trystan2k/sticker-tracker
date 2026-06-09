import { describe, expect, it } from 'vitest';

import type { ShareRouteSearch } from '@/components/share/share-state';
import { Route as RepeatedShareRoute } from '@/routes/repeated-share';
import { Route as RepeatedShareIndexRoute } from '@/routes/repeated-share/index';
import { Route as RepeatedSharePreviewRoute } from '@/routes/repeated-share/preview';

describe('repeated-share route (parent)', () => {
  it('route is defined with component', () => {
    expect(RepeatedShareRoute.options.component).toBeTypeOf('function');
  });
});

describe('repeated-share/index route', () => {
  it('route is defined with validateSearch', () => {
    expect(RepeatedShareIndexRoute.options.validateSearch).toBeTypeOf('function');
  });

  it('validateSearch keeps repeated share search params', () => {
    const validateSearch = RepeatedShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;

    expect(validateSearch({ pages: 'mex,rsa', from: '/repeated' })).toEqual({
      pages: 'mex,rsa',
      from: '/repeated'
    });
  });

  it('validateSearch defaults invalid or missing from to repeated route', () => {
    const validateSearch = RepeatedShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;

    expect(validateSearch({ pages: 'mex', from: 'invalid' })).toEqual({
      pages: 'mex',
      from: '/repeated'
    });
    expect(validateSearch({ pages: 'mex' })).toEqual({
      pages: 'mex',
      from: '/repeated'
    });
  });
});

describe('repeated-share/preview route', () => {
  it('route is defined with validateSearch', () => {
    expect(RepeatedSharePreviewRoute.options.validateSearch).toBeTypeOf('function');
  });

  it('validateSearch ignores non-string values', () => {
    const validateSearch = RepeatedSharePreviewRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;

    expect(validateSearch({ pages: null, from: 1 })).toEqual({ from: '/repeated' });
  });

  it('validateSearch keeps repeated fallback when from missing', () => {
    const validateSearch = RepeatedSharePreviewRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;

    expect(validateSearch({ pages: 'mex' })).toEqual({
      pages: 'mex',
      from: '/repeated'
    });
  });
});

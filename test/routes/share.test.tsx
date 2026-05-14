import { describe, expect, it } from 'vitest';

import type { ShareRouteSearch } from '@/components/share/share-state';
import { Route as ShareIndexRoute } from '@/routes/share/index';
import { Route as SharePreviewRoute } from '@/routes/share/preview';

describe('share/index route', () => {
  it('route is defined with validateSearch', () => {
    expect(ShareIndexRoute.options.validateSearch).toBeTypeOf('function');
  });

  it('route has component defined', () => {
    expect(ShareIndexRoute.options.component).toBeTypeOf('function');
  });

  it('validateSearch extracts pages from raw search', () => {
    const validateSearch = ShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ pages: 'mex,fwc-opening' });

    expect(result.pages).toBe('mex,fwc-opening');
  });

  it('validateSearch extracts from from raw search', () => {
    const validateSearch = ShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ from: '/album/mex' });

    expect(result.from).toBe('/album/mex');
  });

  it('validateSearch ignores non-string pages', () => {
    const validateSearch = ShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ pages: 123 });

    expect(result.pages).toBeUndefined();
  });

  it('validateSearch ignores non-string from', () => {
    const validateSearch = ShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ from: 123 });

    expect(result.from).toBeUndefined();
  });

  it('validateSearch returns empty object for empty input', () => {
    const validateSearch = ShareIndexRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({});

    expect(result.pages).toBeUndefined();
    expect(result.from).toBeUndefined();
  });
});

describe('share/preview route', () => {
  it('route is defined with validateSearch', () => {
    expect(SharePreviewRoute.options.validateSearch).toBeTypeOf('function');
  });

  it('route has component defined', () => {
    expect(SharePreviewRoute.options.component).toBeTypeOf('function');
  });

  it('validateSearch extracts pages from raw search', () => {
    const validateSearch = SharePreviewRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ pages: 'mex' });

    expect(result.pages).toBe('mex');
  });

  it('validateSearch extracts from from raw search', () => {
    const validateSearch = SharePreviewRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ from: '/share' });

    expect(result.from).toBe('/share');
  });

  it('validateSearch ignores non-string values', () => {
    const validateSearch = SharePreviewRoute.options.validateSearch as (
      search: Record<string, unknown>
    ) => ShareRouteSearch;
    const result = validateSearch({ pages: null, from: undefined });

    expect(result.pages).toBeUndefined();
    expect(result.from).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';

import { Route } from '@/routes/stat';

describe('stat route', () => {
  const validateSearch = Route.options.validateSearch as (input: { from?: unknown }) => {
    from?: string;
  };

  it('route is defined with component', () => {
    expect(Route.options.component).toBeTypeOf('function');
  });

  it('validateSearch drops non-string from values', () => {
    expect(validateSearch({ from: null })).toEqual({});
  });

  it('validateSearch keeps string from values', () => {
    expect(validateSearch({ from: '/share?pages=mex#preview' })).toEqual({
      from: '/share?pages=mex#preview'
    });
  });
});

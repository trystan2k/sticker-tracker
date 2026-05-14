import { describe, expect, it } from 'vitest';

import { Route, Home } from '@/routes/index';

describe('index route', () => {
  describe('Route configuration', () => {
    it('route is defined with component', () => {
      expect(Route.options.component).toBeTypeOf('function');
    });
  });

  describe('Home component', () => {
    it('Home is defined as a function', () => {
      expect(Home).toBeTypeOf('function');
    });
  });
});

import { describe, expect, it } from 'vitest';

import { Route } from '@/routes/index';

describe('index route', () => {
  describe('Route configuration', () => {
    it('route is defined with component', () => {
      expect(Route.options.component).toBeTypeOf('function');
    });
  });
});

import { describe, expect, it } from 'vitest';

import { FEATURE_FLAGS } from '@/config/features';
import { Route } from '@/routes/scanner';

describe('scanner route', () => {
  it('route is defined with component', () => {
    expect(Route.options.component).toBeTypeOf('function');
  });

  it('route has feature-flag guard', () => {
    expect(Route.options.beforeLoad).toBeTypeOf('function');
  });

  describe('beforeLoad', () => {
    it('does not throw when scanner is enabled (current env)', () => {
      expect(FEATURE_FLAGS.scannerEnabled).toBe(true);
      const beforeLoad = Route.options.beforeLoad;
      if (!beforeLoad) {
        throw new Error('beforeLoad is undefined');
      }
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      expect(() => beforeLoad({} as any)).not.toThrow();
    });

    it('contains redirect logic for disabled scanner', () => {
      const beforeLoad = Route.options.beforeLoad;
      if (!beforeLoad) {
        throw new Error('beforeLoad is undefined');
      }
      const beforeLoadStr = beforeLoad.toString();
      expect(beforeLoadStr).toContain('redirect');
      expect(beforeLoadStr).toContain('scannerEnabled');
    });
  });

  describe('ScannerRoute component', () => {
    it('component is a function', () => {
      expect(Route.options.component).toBeTypeOf('function');
    });
  });
});

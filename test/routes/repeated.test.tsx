import { describe, expect, it } from 'vitest';

import { Route as RepeatedRoute } from '@/routes/repeated';

describe('repeated route', () => {
  it('route is defined with component', () => {
    expect(RepeatedRoute.options.component).toBeTypeOf('function');
  });
});

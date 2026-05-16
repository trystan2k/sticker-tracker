import { describe, expect, it, vi } from 'vitest';

// Mock feature flag to disabled — must be at top level (hoisted automatically)
vi.mock('@/config/features', () => ({
  FEATURE_FLAGS: {
    scannerEnabled: false
  }
}));

describe('scanner route (disabled)', () => {
  it('throws redirect when scanner is disabled', async () => {
    // Dynamic import to ensure mock is applied before module loads
    const { Route } = await import('@/routes/scanner');
    const beforeLoad = Route.options.beforeLoad;
    if (!beforeLoad) {
      throw new Error('beforeLoad is undefined');
    }

    let thrown: unknown;
    try {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      beforeLoad({} as any);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    // TanStack Router's redirect() throws a Response object
    expect(thrown instanceof Response).toBe(true);
  });
});

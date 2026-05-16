import { describe, expect, it } from 'vitest';

import { resolveScannerEnabled } from '@/config/features';

describe('resolveScannerEnabled', () => {
  it('returns true when env override is true', () => {
    expect(resolveScannerEnabled({ VITE_SCANNER_ENABLED: 'true', PROD: true })).toBe(true);
  });

  it('returns false when env override is false', () => {
    expect(resolveScannerEnabled({ VITE_SCANNER_ENABLED: 'false', PROD: false })).toBe(false);
  });

  it('defaults to false in production without override', () => {
    expect(resolveScannerEnabled({ PROD: true })).toBe(false);
  });

  it('defaults to true in non-production without override', () => {
    expect(resolveScannerEnabled({ PROD: false })).toBe(true);
  });
});

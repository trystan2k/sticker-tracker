import { describe, expect, it } from 'vitest';

import { applyTheme } from '@/services/theme-service';

describe('applyTheme', () => {
  it('applies light theme by setting data-theme attribute', () => {
    document.documentElement.removeAttribute('data-theme');

    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('applies dark theme by setting data-theme attribute', () => {
    document.documentElement.removeAttribute('data-theme');

    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('applies system theme by removing data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'light');

    applyTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('does not throw when called with valid theme values', () => {
    expect(() => applyTheme('light')).not.toThrow();
    expect(() => applyTheme('dark')).not.toThrow();
    expect(() => applyTheme('system')).not.toThrow();
  });
});

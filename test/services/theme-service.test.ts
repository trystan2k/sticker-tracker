import { describe, expect, it, vi } from 'vitest';

import { readTheme, saveTheme, SUPPORTED_THEMES } from '@/services/theme-service';

const { readMock, writeMock } = vi.hoisted(() => ({
  readMock: vi.fn<() => Promise<unknown>>(),
  writeMock: vi.fn<() => Promise<unknown>>()
}));

vi.mock('@/lib/storage/app-storage', () => ({
  read: readMock,
  write: writeMock
}));

describe('theme-service', () => {
  it('exposes expected supported themes', () => {
    expect(SUPPORTED_THEMES).toEqual(['light', 'dark', 'system']);
  });

  it('exports applyTheme function that does not throw', async () => {
    const { applyTheme } = await import('@/services/theme-service');

    expect(typeof applyTheme).toBe('function');
    expect(() => applyTheme('light')).not.toThrow();
    expect(() => applyTheme('dark')).not.toThrow();
    expect(() => applyTheme('system')).not.toThrow();
  });

  it('reads saved theme from storage', async () => {
    readMock.mockResolvedValueOnce({ state: 'ready', value: 'dark' });

    const result = await readTheme();
    expect(result).toBe('dark');
  });

  it('returns system when storage result is not ready', async () => {
    readMock.mockResolvedValueOnce({ state: 'unavailable' });

    const result = await readTheme();
    expect(result).toBe('system');
  });

  it('returns system when stored value is null', async () => {
    readMock.mockResolvedValueOnce({ state: 'ready', value: null });

    const result = await readTheme();
    expect(result).toBe('system');
  });

  it('returns system when stored value is not a valid theme', async () => {
    readMock.mockResolvedValueOnce({ state: 'ready', value: 'invalid-theme' });

    const result = await readTheme();
    expect(result).toBe('system');
  });

  it('saves theme to storage', async () => {
    writeMock.mockResolvedValueOnce({ state: 'ready' });

    await saveTheme('light');
    expect(writeMock).toHaveBeenCalledWith('theme', 'light');
  });
});

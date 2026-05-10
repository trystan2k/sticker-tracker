import { afterEach, describe, expect, it, vi } from 'vitest';

const { saveSupportedLocaleMock } = vi.hoisted(() => ({
  saveSupportedLocaleMock: vi.fn<() => Promise<unknown>>()
}));

vi.mock('@/services/locale_service', () => ({
  saveSupportedLocale: saveSupportedLocaleMock
}));

async function importConfig() {
  const { changeLocale, getI18nInstance, initializeI18n } = await import('@/i18n/config');
  return { changeLocale, getI18nInstance, initializeI18n };
}

describe('i18n config', () => {
  afterEach(() => {
    vi.resetModules();
  });

  describe('initializeI18n', () => {
    it('initializes i18n on first call', async () => {
      const { getI18nInstance, initializeI18n } = await importConfig();

      await initializeI18n('en');

      const instance = getI18nInstance();
      expect(instance.isInitialized).toBe(true);
      expect(instance.language).toBe('en');
    });

    it('reuses existing instance on second call without re-initializing', async () => {
      const { getI18nInstance, initializeI18n } = await importConfig();

      await initializeI18n('en');
      const instanceA = getI18nInstance();

      await initializeI18n('en');
      const instanceB = getI18nInstance();

      expect(instanceA).toBe(instanceB);
      expect(instanceB.language).toBe('en');
    });

    it('changes language when called with different locale after init', async () => {
      const { getI18nInstance, initializeI18n } = await importConfig();

      await initializeI18n('en');
      await initializeI18n('pt-BR');

      const instance = getI18nInstance();
      expect(instance.language).toBe('pt-BR');
    });
  });

  describe('getI18nInstance', () => {
    it('returns the same instance across calls', async () => {
      const { getI18nInstance, initializeI18n } = await importConfig();

      await initializeI18n('en');

      const first = getI18nInstance();
      const second = getI18nInstance();

      expect(first).toBe(second);
    });
  });

  describe('changeLocale', () => {
    it('persists locale and returns it on success', async () => {
      saveSupportedLocaleMock.mockResolvedValueOnce({ state: 'ready' });

      const { changeLocale, initializeI18n } = await importConfig();

      await initializeI18n('en');
      const result = await changeLocale('es');

      expect(result).toBe('es');
      expect(saveSupportedLocaleMock).toHaveBeenCalledWith('es');
    });

    it('returns null when persistence fails', async () => {
      saveSupportedLocaleMock.mockResolvedValueOnce({ state: 'unavailable' });

      const { changeLocale, initializeI18n } = await importConfig();

      await initializeI18n('en');
      const result = await changeLocale('pt-BR');

      expect(result).toBeNull();
      expect(saveSupportedLocaleMock).toHaveBeenCalledWith('pt-BR');
    });
  });
});

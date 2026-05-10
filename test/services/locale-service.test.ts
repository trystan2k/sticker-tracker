import { describe, expect, it, vi } from 'vitest';

import {
  loadSavedLocale,
  resolveSupportedLocale,
  saveSupportedLocale,
  SUPPORTED_LOCALES
} from '@/services/locale-service';

const { readMock, writeMock } = vi.hoisted(() => ({
  readMock: vi.fn<() => Promise<unknown>>(),
  writeMock: vi.fn<() => Promise<unknown>>()
}));

vi.mock('@/lib/storage/app-storage', () => ({
  read: readMock,
  write: writeMock
}));

describe('locale-service', () => {
  it('exposes expected supported locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'pt-BR', 'es']);
  });

  it('loads saved locale from storage', async () => {
    readMock.mockResolvedValueOnce({ state: 'ready', value: 'pt-BR' });

    const result = await loadSavedLocale();
    expect(result).toEqual({ state: 'ready', value: 'pt-BR' });
  });

  it('saves supported locale to storage', async () => {
    writeMock.mockResolvedValueOnce({ state: 'ready' });

    const result = await saveSupportedLocale('es');
    expect(result).toEqual({ state: 'ready' });
    expect(writeMock).toHaveBeenCalledWith('locale', 'es');
  });

  it('resolves locale with precedence saved -> navigator.languages -> navigator.language -> en', () => {
    expect(
      resolveSupportedLocale({
        savedLocale: 'pt-BR',
        navigatorLanguages: ['es-MX'],
        navigatorLanguage: 'en-US'
      })
    ).toBe('pt-BR');

    expect(
      resolveSupportedLocale({
        savedLocale: null,
        navigatorLanguages: ['pt-PT', 'es-MX'],
        navigatorLanguage: 'en-US'
      })
    ).toBe('pt-BR');

    expect(
      resolveSupportedLocale({
        savedLocale: null,
        navigatorLanguages: ['fr-FR'],
        navigatorLanguage: 'es-AR'
      })
    ).toBe('es');

    expect(
      resolveSupportedLocale({
        savedLocale: null,
        navigatorLanguages: ['fr-FR'],
        navigatorLanguage: 'de-DE'
      })
    ).toBe('en');
  });
});

import { describe, expect, it } from 'vitest';

import enTranslation from '@/locales/en/translation.json';
import esTranslation from '@/locales/es/translation.json';
import ptBrTranslation from '@/locales/pt-BR/translation.json';
import { resolveSupportedLocale } from '@/services/locale-service';

type JsonObject = Record<string, unknown>;

function collectKeys(source: JsonObject, prefix = ''): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value as JsonObject, nextPrefix);
    }

    return [nextPrefix];
  });
}

describe('translation resources', () => {
  it('keeps locale key trees aligned', () => {
    const enKeys = collectKeys(enTranslation).toSorted();
    const ptBrKeys = collectKeys(ptBrTranslation).toSorted();
    const esKeys = collectKeys(esTranslation).toSorted();

    expect(ptBrKeys).toEqual(enKeys);
    expect(esKeys).toEqual(enKeys);
  });

  it('resolves locale using expected fallback order', () => {
    expect(
      resolveSupportedLocale({
        savedLocale: 'es',
        navigatorLanguages: ['pt-BR'],
        navigatorLanguage: 'en-US'
      })
    ).toBe('es');

    expect(
      resolveSupportedLocale({
        savedLocale: null,
        navigatorLanguages: ['pt-PT'],
        navigatorLanguage: 'en-US'
      })
    ).toBe('pt-BR');

    expect(
      resolveSupportedLocale({
        savedLocale: null,
        navigatorLanguages: ['fr-FR'],
        navigatorLanguage: 'de-DE'
      })
    ).toBe('en');
  });
});

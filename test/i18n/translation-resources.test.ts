import { describe, expect, it } from 'vitest';

import { albumPages, GROUP_LIST } from '@/data/album';
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

function resolveValue(obj: JsonObject, dotPath: string): unknown {
  const parts = dotPath.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    current = (current as JsonObject)[part];
  }

  return current;
}

type LocaleResource = JsonObject & {
  team?: JsonObject;
  group?: JsonObject;
  album?: JsonObject;
  special?: JsonObject;
};

const allLocales: ReadonlyArray<{ name: string; resource: LocaleResource }> = [
  { name: 'en', resource: enTranslation as LocaleResource },
  { name: 'pt-BR', resource: ptBrTranslation as LocaleResource },
  { name: 'es', resource: esTranslation as LocaleResource }
];

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

  describe('album page translation keys', () => {
    it('every albumPages entry has a translationKey that exists in each locale', () => {
      for (const page of albumPages) {
        for (const { name, resource } of allLocales) {
          const value = resolveValue(resource, page.translationKey);

          expect(
            value,
            `Missing translation key "${page.translationKey}" for page "${page.pageId}" in locale "${name}"`
          ).toBeDefined();
          expect(
            typeof value,
            `Translation key "${page.translationKey}" in locale "${name}" should be a string`
          ).toBe('string');
        }
      }
    });
  });

  describe('group labels', () => {
    it('every group (a through l) exists in each locale', () => {
      const groupKeys = GROUP_LIST.map((g) => `group.${g.toLowerCase()}`);

      for (const key of groupKeys) {
        for (const { name, resource } of allLocales) {
          const value = resolveValue(resource, key);

          expect(value, `Missing group key "${key}" in locale "${name}"`).toBeDefined();
          expect(typeof value, `Group key "${key}" in locale "${name}" should be a string`).toBe(
            'string'
          );
        }
      }
    });
  });

  describe('album special section keys', () => {
    it('every album.specialSection key exists in each locale', () => {
      const specialSectionKeys = [
        'album.specialSection.fwc-opening',
        'album.specialSection.fwc-closing',
        'album.specialSection.coca-cola'
      ];

      for (const key of specialSectionKeys) {
        for (const { name, resource } of allLocales) {
          const value = resolveValue(resource, key);

          expect(value, `Missing special section key "${key}" in locale "${name}"`).toBeDefined();
          expect(
            typeof value,
            `Special section key "${key}" in locale "${name}" should be a string`
          ).toBe('string');
        }
      }
    });
  });
});

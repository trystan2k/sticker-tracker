import { read, type StorageState, write } from '@/lib/storage/app-storage';

export const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleLoadResult =
  | {
      state: 'ready';
      value: string | null;
    }
  | {
      state: Exclude<StorageState, 'ready'>;
    };

export type LocaleSaveResult = {
  state: StorageState;
};

function toLanguageTag(locale: string): string {
  return locale.trim().toLowerCase();
}

function findSupportedLocale(candidateLocale: string): SupportedLocale | null {
  const normalizedCandidate = toLanguageTag(candidateLocale);

  const exactMatch = SUPPORTED_LOCALES.find(
    (supportedLocale) => toLanguageTag(supportedLocale) === normalizedCandidate
  );

  if (exactMatch) {
    return exactMatch;
  }

  const [candidateLanguage] = normalizedCandidate.split('-');
  if (!candidateLanguage) {
    return null;
  }

  return (
    SUPPORTED_LOCALES.find((supportedLocale) => {
      const [supportedLanguage] = toLanguageTag(supportedLocale).split('-');

      return supportedLanguage === candidateLanguage;
    }) ?? null
  );
}

export async function loadSavedLocale(): Promise<LocaleLoadResult> {
  const readResult = await read('locale');

  if (readResult.state === 'ready') {
    return {
      state: 'ready',
      value: readResult.value
    };
  }

  return { state: readResult.state };
}

export async function saveSupportedLocale(locale: SupportedLocale): Promise<LocaleSaveResult> {
  return write('locale', locale);
}

export type ResolveSupportedLocaleInput = Readonly<{
  savedLocale: string | null;
  navigatorLanguages?: readonly string[];
  navigatorLanguage?: string;
}>;

export function resolveSupportedLocale({
  savedLocale,
  navigatorLanguages,
  navigatorLanguage
}: ResolveSupportedLocaleInput): SupportedLocale {
  if (savedLocale !== null) {
    const savedLocaleMatch = findSupportedLocale(savedLocale);

    if (savedLocaleMatch) {
      return savedLocaleMatch;
    }
  }

  if (navigatorLanguages) {
    for (const locale of navigatorLanguages) {
      const localeMatch = findSupportedLocale(locale);

      if (localeMatch) {
        return localeMatch;
      }
    }
  }

  if (navigatorLanguage) {
    const navigatorLanguageMatch = findSupportedLocale(navigatorLanguage);

    if (navigatorLanguageMatch) {
      return navigatorLanguageMatch;
    }
  }

  return 'en';
}

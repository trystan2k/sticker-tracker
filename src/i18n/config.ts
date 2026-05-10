import { createInstance, type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '@/locales/en/translation.json';
import esTranslations from '@/locales/es/translation.json';
import ptBrTranslations from '@/locales/pt-BR/translation.json';
import { saveSupportedLocale, type SupportedLocale } from '@/services/locale-service';

const defaultNamespace = 'translation';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  'pt-BR': { translation: ptBrTranslations }
} as const;

const i18n: I18nInstance = createInstance();

let initializePromise: Promise<void> | null = null;

// Eagerly initialize i18n with 'en' so t() is available before first provider render
initializePromise = i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    defaultNS: defaultNamespace
  })
  .then(() => undefined)
  .catch(() => {
    initializePromise = null;
  });

export async function initializeI18n(locale: SupportedLocale): Promise<void> {
  // Retry logic: if a previous init failed and set initializePromise to null, re-initialize
  if (initializePromise === null) {
    initializePromise = i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: locale,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false
        },
        defaultNS: defaultNamespace
      })
      .then(() => undefined)
      .catch(() => {
        initializePromise = null;
      });
  }

  await initializePromise;

  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
}

export function getI18nInstance(): I18nInstance {
  return i18n;
}

export async function changeLocale(locale: SupportedLocale): Promise<SupportedLocale | null> {
  await initializeI18n(locale);

  const saveResult = await saveSupportedLocale(locale);
  if (saveResult.state !== 'ready') {
    return null;
  }

  return locale;
}

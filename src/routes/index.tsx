import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useContext, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AppStateContext } from '@/providers/AppStateProvider';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/services/locale-service';

export const Route = createFileRoute('/')({ component: Home });

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((supportedLocale) => supportedLocale === value);
}

function Home() {
  const appState = useContext(AppStateContext);
  const { t } = useTranslation();

  if (appState === null) {
    return null;
  }

  const readyAppState = appState;

  const handleLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      const nextLocale = event.target.value;

      if (!isSupportedLocale(nextLocale)) {
        return;
      }

      void readyAppState.setLocale(nextLocale);
    },
    [readyAppState]
  );

  return (
    <main>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>

      <p>{t('app.success')}</p>
      <p>{t('app.currentLanguage', { locale: readyAppState.locale })}</p>

      <label htmlFor="locale-switcher">{t('locale.label')}</label>
      <select id="locale-switcher" value={readyAppState.locale} onChange={handleLocaleChange}>
        {SUPPORTED_LOCALES.map((localeOption) => (
          <option key={localeOption} value={localeOption}>
            {t(`locale.${localeOption}`)}
          </option>
        ))}
      </select>
    </main>
  );
}

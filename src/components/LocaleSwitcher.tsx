import { useCallback, useContext, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AppStateContext } from '@/providers/AppStateProvider';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/services/locale-service';

import styles from './LocaleSwitcher.module.css';

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((supportedLocale) => supportedLocale === value);
}

export function LocaleSwitcher() {
  const appState = useContext(AppStateContext);
  const { t } = useTranslation();

  const handleLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      const nextLocale = event.target.value;

      if (!isSupportedLocale(nextLocale) || !appState) {
        return;
      }

      void appState.setLocale(nextLocale);
    },
    [appState]
  );

  return (
    <div className={styles.wrapper}>
      <label htmlFor="locale-switcher" className={styles.label}>
        {t('locale.label')}
      </label>
      <select
        id="locale-switcher"
        className={styles.select}
        value={appState?.locale ?? 'en'}
        onChange={handleLocaleChange}
      >
        {SUPPORTED_LOCALES.map((localeOption) => (
          <option key={localeOption} value={localeOption}>
            {t(`locale.${localeOption}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

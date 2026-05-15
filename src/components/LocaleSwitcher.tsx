import { Check, X } from 'lucide-react';
import { useCallback, useContext, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { AppStateContext } from '@/providers/AppStateProvider';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/services/locale-service';

import styles from './LocaleSwitcher.module.css';

const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  en: 'us',
  es: 'es',
  'pt-BR': 'br'
};

interface LocaleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((supportedLocale) => supportedLocale === value);
}

export function LocaleSwitcher({ isOpen, onClose }: LocaleSwitcherProps) {
  const appState = useContext(AppStateContext);
  const { t } = useTranslation();

  const handleLocaleSelect = useCallback(
    (locale: SupportedLocale): void => {
      if (!appState) {
        return;
      }

      void appState.setLocale(locale);
    },
    [appState]
  );

  const handleLocaleButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const locale = event.currentTarget.dataset.locale;

      if (!locale || !isSupportedLocale(locale)) {
        return;
      }

      handleLocaleSelect(locale);
      onClose();
    },
    [handleLocaleSelect, onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return function cleanupKeyDownListener() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('locale.label')}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={t('locale.close')}
      />

      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <span className={styles.title}>{t('locale.sheetTitle')}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('locale.close')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.localeList}>
          {SUPPORTED_LOCALES.map((locale) => {
            const isSelected = appState?.locale === locale;

            return (
              <button
                key={locale}
                type="button"
                className={styles.localeRow}
                onClick={handleLocaleButtonClick}
                aria-label={t(`locale.${locale}`)}
                data-locale={locale}
              >
                <span
                  className={`fi fi-${LOCALE_FLAGS[locale]} ${styles.flagIcon}`}
                  aria-hidden="true"
                />
                <span className={styles.localeName}>{t(`locale.${locale}`)}</span>
                <span className={styles.checkIcon} aria-hidden="true">
                  {isSelected ? <Check size={20} aria-hidden="true" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import { Check, Monitor, Moon, Sun, X } from 'lucide-react';
import { useCallback, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_THEMES, type ThemeValue } from '@/services/theme-service';

import styles from './ThemeSheet.module.css';

interface ThemeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeValue;
  onSelectTheme: (theme: ThemeValue) => void;
}

const THEME_ICON_BY_VALUE: Record<ThemeValue, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor
};

function isSupportedTheme(value: string): value is ThemeValue {
  return SUPPORTED_THEMES.some((supportedTheme) => supportedTheme === value);
}

export function ThemeSheet({ isOpen, onClose, currentTheme, onSelectTheme }: ThemeSheetProps) {
  const { t } = useTranslation();

  const handleSelectTheme = useCallback(
    (theme: ThemeValue) => {
      onSelectTheme(theme);
      onClose();
    },
    [onClose, onSelectTheme]
  );

  const handleThemeButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const selectedTheme = event.currentTarget.dataset.themeOption;

      if (!selectedTheme || !isSupportedTheme(selectedTheme)) {
        return;
      }

      handleSelectTheme(selectedTheme);
    },
    [handleSelectTheme]
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
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('theme.sheetTitle')}
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={t('theme.close')}
      />

      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <span className={styles.title}>{t('theme.sheetTitle')}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('theme.close')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.themeList}>
          {SUPPORTED_THEMES.map((themeOption) => {
            const Icon = THEME_ICON_BY_VALUE[themeOption];
            const isSelected = currentTheme === themeOption;

            return (
              <button
                key={themeOption}
                type="button"
                className={styles.themeRow}
                data-theme-option={themeOption}
                onClick={handleThemeButtonClick}
                aria-label={t(`theme.${themeOption}`)}
              >
                <Icon className={styles.rowIcon} aria-hidden="true" />
                <span className={styles.rowLabel}>{t(`theme.${themeOption}`)}</span>
                {isSelected ? <Check className={styles.rowCheck} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

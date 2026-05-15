import { Share2, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { usePwa } from '@/providers/PwaProvider';

import styles from './PwaInstallSheet.module.css';

export function PwaInstallSheet() {
  const { t } = useTranslation();
  const { isInstallSheetOpen, closeInstallSheet } = usePwa();

  useEffect(() => {
    if (!isInstallSheetOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeInstallSheet();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInstallSheetOpen, closeInstallSheet]);

  if (!isInstallSheetOpen) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('pwa.install.iosTitle')}
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={closeInstallSheet}
        aria-label={t('pwa.install.close')}
      />

      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <span className={styles.title}>{t('pwa.install.iosTitle')}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeInstallSheet}
            aria-label={t('pwa.install.close')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.content}>
          <p className={styles.body}>{t('pwa.install.iosBody')}</p>

          <ol className={styles.steps}>
            <li className={styles.step}>
              <Share2 size={16} aria-hidden="true" />
              <span>{t('pwa.install.iosStepOpenShare')}</span>
            </li>
            <li className={styles.step}>{t('pwa.install.iosStepChooseHomeScreen')}</li>
            <li className={styles.step}>{t('pwa.install.iosStepConfirm')}</li>
          </ol>
        </div>
      </div>
    </div>,
    document.body
  );
}

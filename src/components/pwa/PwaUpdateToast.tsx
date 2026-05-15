import { RotateCw, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePwa } from '@/providers/PwaProvider';

import styles from './PwaUpdateToast.module.css';

export function PwaUpdateToast() {
  const { t } = useTranslation();
  const { isUpdateAvailable, isUpdateDismissed, applyUpdate, dismissUpdate } = usePwa();
  const [isApplying, setIsApplying] = useState(false);

  if (!isUpdateAvailable || isUpdateDismissed) {
    return null;
  }

  const handleApplyUpdate = useCallback(async () => {
    setIsApplying(true);
    await applyUpdate();
  }, [applyUpdate]);

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      aria-label={t('pwa.update.ariaLabel')}
    >
      <div className={styles.content}>
        <RotateCw size={18} aria-hidden="true" />
        <div className={styles.text}>
          <p className={styles.title}>{t('pwa.update.title')}</p>
          <p className={styles.body}>{t('pwa.update.body')}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleApplyUpdate}
          disabled={isApplying}
        >
          {t('pwa.update.action')}
        </button>

        <button
          type="button"
          className={styles.dismissButton}
          onClick={dismissUpdate}
          aria-label={t('pwa.update.dismiss')}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

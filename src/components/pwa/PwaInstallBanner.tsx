import { Download, X } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePwa } from '@/providers/PwaProvider';

import styles from './PwaInstallBanner.module.css';

export function PwaInstallBanner() {
  const { t } = useTranslation();
  const {
    isInstallBannerVisible,
    isUpdateAvailable,
    isUpdateDismissed,
    promptInstall,
    dismissInstallBanner
  } = usePwa();

  const handlePromptInstall = useCallback(() => {
    void promptInstall();
  }, [promptInstall]);

  if (!isInstallBannerVisible || (isUpdateAvailable && !isUpdateDismissed)) {
    return null;
  }

  return (
    <header className={styles.banner} aria-label={t('pwa.install.bannerAriaLabel')}>
      <div className={styles.content}>
        <Download size={20} aria-hidden="true" />
        <div className={styles.text}>
          <p className={styles.title}>{t('pwa.install.bannerTitle')}</p>
          <p className={styles.body}>{t('pwa.install.bannerBody')}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={handlePromptInstall}>
          {t('pwa.install.action')}
        </button>

        <button
          type="button"
          className={styles.dismissButton}
          onClick={dismissInstallBanner}
          aria-label={t('pwa.install.dismiss')}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

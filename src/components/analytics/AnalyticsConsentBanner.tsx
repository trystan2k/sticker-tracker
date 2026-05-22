import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  readAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsent
} from '@/services/analytics-consent';
import { initializeAnalytics } from '@/services/analytics-service';

import styles from './AnalyticsConsentBanner.module.css';

export function AnalyticsConsentBanner() {
  const { t } = useTranslation();
  const [hasMounted, setHasMounted] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent>(() => readAnalyticsConsent());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setConsent(readAnalyticsConsent());
  }, []);

  const handleAccept = useCallback(() => {
    setIsSaving(true);
    saveAnalyticsConsent('granted');
    setConsent('granted');
    void initializeAnalytics().finally(() => {
      setIsSaving(false);
    });
  }, []);

  const handleDecline = useCallback(() => {
    saveAnalyticsConsent('denied');
    setConsent('denied');
  }, []);

  if (!hasMounted || consent !== 'unknown') {
    return null;
  }

  return (
    <section className={styles.banner} aria-label={t('analytics.consent.bannerAriaLabel')}>
      <div className={styles.copy}>
        <p className={styles.title}>{t('analytics.consent.title')}</p>
        <p className={styles.body}>{t('analytics.consent.body')}</p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={handleDecline}
          disabled={isSaving}
        >
          {t('analytics.consent.decline')}
        </button>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={handleAccept}
          disabled={isSaving}
        >
          {isSaving ? t('analytics.consent.saving') : t('analytics.consent.accept')}
        </button>
      </div>
    </section>
  );
}

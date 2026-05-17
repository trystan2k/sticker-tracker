export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

const ANALYTICS_CONSENT_STORAGE_KEY = 'sticker-tracker.analytics-consent';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readAnalyticsConsent(): AnalyticsConsent {
  if (!canUseLocalStorage()) {
    return 'unknown';
  }

  const storedValue = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);

  if (storedValue === 'granted' || storedValue === 'denied') {
    return storedValue;
  }

  return 'unknown';
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'unknown'>): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
}

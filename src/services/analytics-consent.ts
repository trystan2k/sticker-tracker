export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

const ANALYTICS_CONSENT_STORAGE_KEY = 'sticker-tracker.analytics-consent';

function isAutomatedBrowser(): boolean {
  return typeof navigator !== 'undefined' && navigator.webdriver;
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readAnalyticsConsent(): AnalyticsConsent {
  // Keep automation flows deterministic without a blocking consent prompt.
  if (isAutomatedBrowser()) {
    return 'denied';
  }

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

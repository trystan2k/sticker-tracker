import { describe, expect, it, vi } from 'vitest';

import {
  readAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsent
} from '@/services/analytics-consent';

type LocalStorageMock = Pick<Storage, 'getItem' | 'setItem'>;

function stubBrowser({
  webdriver = false,
  storedValue
}: {
  webdriver?: boolean;
  storedValue?: string | null;
}) {
  const localStorage: LocalStorageMock = {
    getItem: vi.fn<(key: string) => string | null>().mockReturnValue(storedValue ?? null),
    setItem: vi.fn<(key: string, value: string) => void>()
  };

  vi.stubGlobal('navigator', { webdriver });
  vi.stubGlobal('window', { localStorage });

  return localStorage;
}

describe('analytics-consent', () => {
  it('returns denied for automated browsers', () => {
    stubBrowser({
      webdriver: true,
      storedValue: 'granted'
    });

    expect(readAnalyticsConsent()).toBe('denied');
  });

  it('returns unknown when localStorage unavailable', () => {
    vi.stubGlobal('navigator', { webdriver: false });
    vi.stubGlobal('window', {});

    expect(readAnalyticsConsent()).toBe('unknown');
  });

  it.each([
    ['granted', 'granted'],
    ['denied', 'denied'],
    ['maybe', 'unknown']
  ] satisfies readonly [string, AnalyticsConsent][])(
    'reads %s consent from localStorage',
    (storedValue, expected) => {
      const localStorage = stubBrowser({
        webdriver: false,
        storedValue
      });

      expect(readAnalyticsConsent()).toBe(expected);
      expect(localStorage.getItem).toHaveBeenCalledWith('sticker-tracker.analytics-consent');
    }
  );

  it('writes granted consent when localStorage available', () => {
    const localStorage = stubBrowser({
      webdriver: false
    });

    saveAnalyticsConsent('granted');

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'sticker-tracker.analytics-consent',
      'granted'
    );
  });

  it('skips writes when localStorage unavailable', () => {
    vi.stubGlobal('window', {});

    expect(() => saveAnalyticsConsent('denied')).not.toThrow();
  });
});

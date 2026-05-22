import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsConsent } from '@/services/analytics-consent';
import { APP_VERSION } from '@/version';

const { readAnalyticsConsentMock, mixpanelClientMock } = vi.hoisted(() => ({
  readAnalyticsConsentMock: vi.fn<() => AnalyticsConsent>(),
  mixpanelClientMock: {
    init: vi.fn<(token: string, config: Record<string, unknown>) => void>(),
    register: vi.fn<(properties: Record<string, unknown>) => void>(),
    track: vi.fn<(eventName: string, properties: Record<string, unknown>) => void>()
  }
}));

vi.mock('@/services/analytics-consent', () => ({
  readAnalyticsConsent: readAnalyticsConsentMock
}));

vi.mock('mixpanel-browser', () => ({
  default: mixpanelClientMock
}));

async function loadAnalyticsModule() {
  vi.resetModules();
  return import('@/services/analytics-service');
}

describe('analytics-service', () => {
  beforeEach(() => {
    readAnalyticsConsentMock.mockReset();
    mixpanelClientMock.init.mockReset();
    mixpanelClientMock.register.mockReset();
    mixpanelClientMock.track.mockReset();
  });

  it('returns false when called without browser window', async () => {
    readAnalyticsConsentMock.mockReturnValue('granted');

    const { initializeAnalytics } = await loadAnalyticsModule();

    await expect(initializeAnalytics()).resolves.toBe(false);
    expect(mixpanelClientMock.init).not.toHaveBeenCalled();
    expect(mixpanelClientMock.register).not.toHaveBeenCalled();
  });

  it('returns false when consent is not granted', async () => {
    vi.stubGlobal('window', {});
    readAnalyticsConsentMock.mockReturnValue('denied');

    const { initializeAnalytics } = await loadAnalyticsModule();

    await expect(initializeAnalytics()).resolves.toBe(false);
    expect(mixpanelClientMock.init).not.toHaveBeenCalled();
  });

  it('initializes mixpanel once and reuses existing client', async () => {
    vi.stubGlobal('window', {});
    readAnalyticsConsentMock.mockReturnValue('granted');

    const { initializeAnalytics } = await loadAnalyticsModule();

    await expect(initializeAnalytics()).resolves.toBe(true);
    await expect(initializeAnalytics()).resolves.toBe(true);

    expect(mixpanelClientMock.init).toHaveBeenCalledTimes(1);
    expect(mixpanelClientMock.init).toHaveBeenCalledWith('b0af996b5ea6025e1d6fd07284975391', {
      debug: expect.any(Boolean),
      ignore_dnt: false,
      persistence: 'localStorage',
      track_pageview: false
    });
    expect(mixpanelClientMock.register).toHaveBeenCalledTimes(1);
    expect(mixpanelClientMock.register).toHaveBeenCalledWith({
      app_version: APP_VERSION,
      platform: 'web'
    });
  });

  it('coalesces concurrent initialization calls', async () => {
    vi.stubGlobal('window', {});
    readAnalyticsConsentMock.mockReturnValue('granted');

    const { initializeAnalytics } = await loadAnalyticsModule();

    await Promise.all([initializeAnalytics(), initializeAnalytics()]);

    expect(mixpanelClientMock.init).toHaveBeenCalledTimes(1);
    expect(mixpanelClientMock.register).toHaveBeenCalledTimes(1);
  });

  it('tracks event when analytics is initialized', async () => {
    vi.stubGlobal('window', {});
    readAnalyticsConsentMock.mockReturnValue('granted');

    const { trackAnalyticsEvent } = await loadAnalyticsModule();

    await trackAnalyticsEvent('stats_cta_clicked', { source_path: '/' });

    expect(mixpanelClientMock.track).toHaveBeenCalledTimes(1);
    expect(mixpanelClientMock.track).toHaveBeenCalledWith('stats_cta_clicked', {
      source_path: '/'
    });
  });

  it('skips tracking when initialization fails', async () => {
    vi.stubGlobal('window', {});
    readAnalyticsConsentMock.mockReturnValue('unknown');

    const { trackAnalyticsEvent } = await loadAnalyticsModule();

    await trackAnalyticsEvent('stats_page_opened', { source_path: '/stat' });

    expect(mixpanelClientMock.track).not.toHaveBeenCalled();
  });
});

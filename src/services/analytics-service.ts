import { readAnalyticsConsent } from '@/services/analytics-consent';
import { APP_VERSION } from '@/version';

type AnalyticsEventName =
  | 'share_preview_generated'
  | 'stats_cta_clicked'
  | 'stats_page_opened'
  | 'stickers_marked_collected';

type AnalyticsProperties = Readonly<Record<string, unknown>>;

type MixpanelClient = (typeof import('mixpanel-browser'))['default'];

const MIXPANEL_TOKEN = 'b0af996b5ea6025e1d6fd07284975391';

let mixpanelClient: MixpanelClient | null = null;
let initializePromise: Promise<boolean> | null = null;

async function loadMixpanelClient(): Promise<MixpanelClient> {
  const module = await import('mixpanel-browser');

  return module.default;
}

export async function initializeAnalytics(): Promise<boolean> {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted') {
    return false;
  }

  if (!MIXPANEL_TOKEN) {
    return false;
  }

  if (mixpanelClient) {
    return true;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    const client = await loadMixpanelClient();

    client.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.DEV,
      ignore_dnt: false,
      persistence: 'localStorage',
      track_pageview: false
    });
    client.register({
      app_version: APP_VERSION,
      platform: 'web'
    });

    mixpanelClient = client;
    return true;
  })();

  try {
    return await initializePromise;
  } finally {
    initializePromise = null;
  }
}

export async function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties
): Promise<void> {
  const isInitialized = await initializeAnalytics();

  if (!isInitialized || !mixpanelClient) {
    return;
  }

  mixpanelClient.track(eventName, properties);
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { AnalyticsConsentBanner } from '@/components/analytics/AnalyticsConsentBanner';
import type { AnalyticsConsent } from '@/services/analytics-consent';

const { readAnalyticsConsentMock, saveAnalyticsConsentMock, initializeAnalyticsMock } = vi.hoisted(
  () => ({
    readAnalyticsConsentMock: vi.fn<() => AnalyticsConsent>(),
    saveAnalyticsConsentMock: vi.fn<(consent: Exclude<AnalyticsConsent, 'unknown'>) => void>(),
    initializeAnalyticsMock: vi.fn<() => Promise<boolean>>()
  })
);

vi.mock('@/services/analytics-consent', () => ({
  readAnalyticsConsent: readAnalyticsConsentMock,
  saveAnalyticsConsent: saveAnalyticsConsentMock
}));

vi.mock('@/services/analytics-service', () => ({
  initializeAnalytics: initializeAnalyticsMock
}));

function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (predicate()) {
        resolve();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('waitFor timeout'));
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}

function mount(child: ReturnType<typeof createElement>): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(child);

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

describe('AnalyticsConsentBanner', () => {
  beforeEach(() => {
    readAnalyticsConsentMock.mockReset();
    saveAnalyticsConsentMock.mockReset();
    initializeAnalyticsMock.mockReset();

    readAnalyticsConsentMock.mockReturnValue('unknown');
    initializeAnalyticsMock.mockResolvedValue(true);
  });

  it('stays hidden when consent already resolved', async () => {
    readAnalyticsConsentMock.mockReturnValue('granted');

    const mounted = mount(createElement(AnalyticsConsentBanner));

    try {
      await waitFor(() => mounted.container.textContent === '');

      expect(mounted.container.querySelector('section')).toBeNull();
      expect(saveAnalyticsConsentMock).not.toHaveBeenCalled();
      expect(initializeAnalyticsMock).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('saves denied consent and hides banner on decline', async () => {
    const mounted = mount(createElement(AnalyticsConsentBanner));

    try {
      await waitFor(() => mounted.container.textContent?.includes('Allow analytics?') ?? false);

      const declineButton = Array.from(mounted.container.querySelectorAll('button')).find(
        (button) => button.textContent?.includes('Decline')
      );
      declineButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => mounted.container.querySelector('section') === null);

      expect(saveAnalyticsConsentMock).toHaveBeenCalledTimes(1);
      expect(saveAnalyticsConsentMock).toHaveBeenCalledWith('denied');
      expect(initializeAnalyticsMock).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('saves granted consent and initializes analytics on accept', async () => {
    const mounted = mount(createElement(AnalyticsConsentBanner));

    try {
      await waitFor(() => mounted.container.textContent?.includes('Allow analytics?') ?? false);

      const allowButton = Array.from(mounted.container.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Allow')
      );
      allowButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await waitFor(() => initializeAnalyticsMock.mock.calls.length === 1);
      await waitFor(() => mounted.container.querySelector('section') === null);

      expect(saveAnalyticsConsentMock).toHaveBeenCalledTimes(1);
      expect(saveAnalyticsConsentMock).toHaveBeenCalledWith('granted');
      expect(initializeAnalyticsMock).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

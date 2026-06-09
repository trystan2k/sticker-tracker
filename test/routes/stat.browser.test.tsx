import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { AppStateContext } from '@/providers/AppStateProvider';
import type { CollectionState } from '@/services/collection-service';
import type { trackAnalyticsEvent } from '@/services/analytics-service';
import { waitForCondition } from '../helpers/async';
import { createCollectionState } from '../helpers/typed-factories';

const { navigateMock, trackAnalyticsEventMock, useSearchMock } = vi.hoisted(() => ({
  navigateMock: vi.fn<(input: { to: '/' }) => void>(),
  trackAnalyticsEventMock: vi.fn<typeof trackAnalyticsEvent>(),
  useSearchMock: vi.fn<() => { from?: string }>(() => ({}))
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: useSearchMock
  };
});

vi.mock('@/services/analytics-service', () => ({
  trackAnalyticsEvent: trackAnalyticsEventMock
}));

vi.mock('@/components/stats/StatsScreen', () => ({
  StatsScreen: ({ onBack }: { onBack: () => void }) =>
    React.createElement(
      'div',
      { 'data-testid': 'stats-screen' },
      React.createElement(
        'button',
        { 'data-testid': 'stats-back', type: 'button', onClick: onBack },
        'Back'
      )
    )
}));

function mount(child: React.ReactNode): { container: HTMLDivElement; root: Root } {
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

function makeReadyState(collection: CollectionState = createCollectionState({})) {
  return {
    collection,
    renderState: 'ready' as const,
    locale: 'en' as const,
    storageState: 'ready' as const,
    toggleCollected: async () => ({ state: 'ready' as const, value: collection }),
    setStickerQuantity: async () => ({ state: 'ready' as const, value: collection }),
    setLocale: async () => 'ready' as const,
    retryBootstrap: async () => {}
  };
}

describe('stat route component', () => {
  it('tracks stats page open once from cta source and handles back navigation', async () => {
    navigateMock.mockClear();
    trackAnalyticsEventMock.mockClear();
    useSearchMock.mockReturnValue({ from: '/' });

    const { Route: StatRoute } = await import('@/routes/stat');
    const Component = StatRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const appState = makeReadyState(createCollectionState({ mex: ['MEX-1'] }));

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: appState as never },
        React.createElement(React.StrictMode, null, React.createElement(Component))
      )
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="stats-screen"]') !== null
      );
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(1);
      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('stats_page_opened', {
        source_path: '/'
      });

      const backButton = mounted.container.querySelector(
        '[data-testid="stats-back"]'
      ) as HTMLButtonElement;
      backButton.click();

      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    } finally {
      cleanup(mounted);
    }
  });

  it('tracks stats page open with direct-entry fallback source', async () => {
    trackAnalyticsEventMock.mockClear();
    useSearchMock.mockReturnValue({});

    const { Route: StatRoute } = await import('@/routes/stat');
    const Component = StatRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const appState = makeReadyState(createCollectionState({ mex: ['MEX-1'] }));

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: appState as never },
        React.createElement(React.StrictMode, null, React.createElement(Component))
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('stats_page_opened', {
        source_path: '/stat'
      });
    } finally {
      cleanup(mounted);
    }
  });

  it('strips query and hash from source path before tracking', async () => {
    trackAnalyticsEventMock.mockClear();
    useSearchMock.mockReturnValue({ from: '/share?pages=mex#preview' });

    const { Route: StatRoute } = await import('@/routes/stat');
    const Component = StatRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const appState = makeReadyState(createCollectionState({ mex: ['MEX-1'] }));

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: appState as never },
        React.createElement(React.StrictMode, null, React.createElement(Component))
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('stats_page_opened', {
        source_path: '/share'
      });
    } finally {
      cleanup(mounted);
    }
  });

  it('uses /stat fallback for unsafe external-like source path', async () => {
    trackAnalyticsEventMock.mockClear();
    useSearchMock.mockReturnValue({ from: 'https://evil.example/phish?x=1#y' });

    const { Route: StatRoute } = await import('@/routes/stat');
    const Component = StatRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const appState = makeReadyState(createCollectionState({ mex: ['MEX-1'] }));

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: appState as never },
        React.createElement(React.StrictMode, null, React.createElement(Component))
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('stats_page_opened', {
        source_path: '/stat'
      });
    } finally {
      cleanup(mounted);
    }
  });

  it('uses /stat fallback for null source path', async () => {
    trackAnalyticsEventMock.mockClear();
    useSearchMock.mockReturnValue({ from: null } as unknown as { from?: string });

    const { Route: StatRoute } = await import('@/routes/stat');
    const Component = StatRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const appState = makeReadyState(createCollectionState({ mex: ['MEX-1'] }));

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: appState as never },
        React.createElement(React.StrictMode, null, React.createElement(Component))
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('stats_page_opened', {
        source_path: '/stat'
      });
    } finally {
      cleanup(mounted);
    }
  });

  it.each([['//evil.example/path'], ['/share\\preview']])(
    'uses /stat fallback for unsafe source path: %s',
    async (unsafeFrom) => {
      trackAnalyticsEventMock.mockClear();
      useSearchMock.mockReturnValue({ from: unsafeFrom });

      const { Route: StatRoute } = await import('@/routes/stat');
      const Component = StatRoute.options.component;

      if (!Component) {
        throw new Error('Route component is undefined');
      }

      const appState = makeReadyState(createCollectionState({ mex: ['MEX-1'] }));

      const mounted = mount(
        React.createElement(
          AppStateContext.Provider,
          { value: appState as never },
          React.createElement(React.StrictMode, null, React.createElement(Component))
        )
      );

      try {
        await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

        expect(trackAnalyticsEventMock).toHaveBeenCalledWith('stats_page_opened', {
          source_path: '/stat'
        });
      } finally {
        cleanup(mounted);
      }
    }
  );
});

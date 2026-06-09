import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { buildMissingState } from '@/components/missing/missing-state';
import { AppStateContext } from '@/providers/AppStateProvider';
import { createCollectionState } from '../helpers/typed-factories';
import { waitForCondition } from '../helpers/async';

type MissingScreenMockProps = {
  onBack: () => void;
  onShare: () => void;
  onToggleCollected: (pageId: string, stickerId: string) => Promise<unknown>;
  collection: unknown;
};

const { navigateMock, missingScreenMock } = vi.hoisted(() => ({
  navigateMock: vi.fn<(input: unknown) => void>(),
  missingScreenMock: vi.fn<(props: MissingScreenMockProps) => void>()
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock('@/components/missing/MissingScreen', () => ({
  MissingScreen: (props: MissingScreenMockProps) => {
    missingScreenMock(props);

    return React.createElement(
      'div',
      { 'data-testid': 'missing-screen' },
      React.createElement(
        'button',
        { 'data-testid': 'missing-back', type: 'button', onClick: props.onBack },
        'Back'
      ),
      React.createElement(
        'button',
        { 'data-testid': 'missing-share', type: 'button', onClick: props.onShare },
        'Share'
      )
    );
  }
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

describe('missing route component', () => {
  it('returns null when app state is not ready', async () => {
    const { Route: MissingRoute } = await import('@/routes/missing');
    const Component = MissingRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(AppStateContext.Provider, { value: null }, React.createElement(Component))
    );

    try {
      expect(mounted.container.querySelector('[data-testid="missing-screen"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('returns null when app state exists but is loading', async () => {
    const { Route: MissingRoute } = await import('@/routes/missing');
    const Component = MissingRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const loadingState = {
      renderState: 'loading' as const,
      storageState: 'ready' as const,
      locale: 'en' as const,
      theme: 'system' as const,
      collection: createCollectionState({}),
      toggleCollected: vi.fn<() => Promise<{ state: 'unavailable' }>>(async () => ({
        state: 'unavailable'
      })),
      setStickerQuantity: vi.fn<() => Promise<{ state: 'unavailable' }>>(async () => ({
        state: 'unavailable'
      })),
      retryBootstrap: async () => {},
      resetAppData: async () => {},
      setLocale: async () => 'ready' as const,
      setTheme: async () => {},
      restoreCollection: async () => ({
        state: 'ready' as const,
        value: createCollectionState({})
      }),
      markScannedStickersAsHave: async () => ({
        state: 'ready' as const,
        value: createCollectionState({}),
        updatedStickerIds: [],
        alreadyCollectedStickerIds: [],
        unknownStickerIds: []
      })
    };

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: loadingState as never },
        React.createElement(Component)
      )
    );

    try {
      expect(mounted.container.querySelector('[data-testid="missing-screen"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens share without pages when collection is all complete', async () => {
    navigateMock.mockClear();
    missingScreenMock.mockClear();

    const { Route: MissingRoute } = await import('@/routes/missing');
    const Component = MissingRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const fullSeed = buildMissingState(createCollectionState({}));

    if (fullSeed.kind !== 'ready') {
      throw new Error('Expected ready seed state');
    }

    const fullCollection = createCollectionState(
      Object.fromEntries(
        fullSeed.pages.map((page) => [
          String(page.pageId),
          page.missingStickerIds.map((stickerId) => String(stickerId))
        ])
      )
    );

    const toggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const readyState = {
      renderState: 'ready' as const,
      storageState: 'ready' as const,
      locale: 'en' as const,
      theme: 'system' as const,
      collection: fullCollection,
      toggleCollected,
      setStickerQuantity: toggleCollected,
      retryBootstrap: async () => {},
      resetAppData: async () => {},
      setLocale: async () => 'ready' as const,
      setTheme: async () => {},
      restoreCollection: async () => ({
        state: 'ready' as const,
        value: createCollectionState({})
      }),
      markScannedStickersAsHave: async () => ({
        state: 'ready' as const,
        value: createCollectionState({}),
        updatedStickerIds: [],
        alreadyCollectedStickerIds: [],
        unknownStickerIds: []
      })
    };

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: readyState as never },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="missing-screen"]') !== null
      );

      const share = mounted.container.querySelector(
        '[data-testid="missing-share"]'
      ) as HTMLButtonElement;
      share.click();

      const shareNavigate = navigateMock.mock.calls.find(
        (call) => (call[0] as { to?: string }).to === '/share'
      )?.[0] as { to: string; search: { pages?: string; from?: string } } | undefined;

      expect(shareNavigate?.to).toBe('/share');
      expect(shareNavigate?.search.from).toBe('/missing');
      expect(shareNavigate?.search.pages).toBeUndefined();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens share with /missing source and selected missing pages', async () => {
    navigateMock.mockClear();
    missingScreenMock.mockClear();

    const { Route: MissingRoute } = await import('@/routes/missing');
    const Component = MissingRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const toggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const firstState = {
      renderState: 'ready' as const,
      storageState: 'ready' as const,
      locale: 'en' as const,
      theme: 'system' as const,
      collection: createCollectionState({
        mex: ['MEX-1'],
        rsa: ['RSA-1', 'RSA-2', 'RSA-3']
      }),
      toggleCollected,
      setStickerQuantity: toggleCollected,
      retryBootstrap: async () => {},
      resetAppData: async () => {},
      setLocale: async () => 'ready' as const,
      setTheme: async () => {},
      restoreCollection: async () => ({
        state: 'ready' as const,
        value: createCollectionState({})
      }),
      markScannedStickersAsHave: async () => ({
        state: 'ready' as const,
        value: createCollectionState({}),
        updatedStickerIds: [],
        alreadyCollectedStickerIds: [],
        unknownStickerIds: []
      })
    };

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: firstState as never },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="missing-screen"]') !== null
      );
      const lastScreenProps = missingScreenMock.mock.calls.at(-1)?.[0];
      expect(lastScreenProps?.collection).toEqual(firstState.collection);

      const share = mounted.container.querySelector(
        '[data-testid="missing-share"]'
      ) as HTMLButtonElement;
      share.click();

      const shareNavigate = navigateMock.mock.calls.find(
        (call) => (call[0] as { to?: string }).to === '/share'
      )?.[0] as { to: string; search: { pages?: string; from?: string } } | undefined;

      expect(shareNavigate?.to).toBe('/share');
      expect(shareNavigate?.search.from).toBe('/missing');
      expect(shareNavigate?.search.pages?.includes('mex')).toBe(true);
      expect(shareNavigate?.search.pages?.includes('rsa')).toBe(true);

      const toggleFromScreen = missingScreenMock.mock.calls.at(-1)?.[0]?.onToggleCollected;
      await toggleFromScreen?.('mex', 'MEX-3');
      expect(toggleCollected).toHaveBeenCalledTimes(1);

      const back = mounted.container.querySelector(
        '[data-testid="missing-back"]'
      ) as HTMLButtonElement;
      back.click();
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    } finally {
      cleanup(mounted);
    }
  });
});

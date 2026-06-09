import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext } from '@/providers/AppStateProvider';
import { createCollectionState } from '../helpers/typed-factories';
import { waitForCondition } from '../helpers/async';

type RepeatedScreenMockProps = {
  onBack: () => void;
  onShare?: () => void;
  onSetStickerQuantity: (pageId: string, stickerId: string, quantity: number) => Promise<unknown>;
  collection: unknown;
  state: unknown;
};

const { navigateMock, repeatedScreenMock } = vi.hoisted(() => ({
  navigateMock: vi.fn<(input: unknown) => void>(),
  repeatedScreenMock: vi.fn<(props: RepeatedScreenMockProps) => void>()
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock('@/components/repeated/RepeatedScreen', () => ({
  RepeatedScreen: (props: RepeatedScreenMockProps) => {
    repeatedScreenMock(props);

    return React.createElement(
      'div',
      { 'data-testid': 'repeated-screen' },
      React.createElement(
        'button',
        { 'data-testid': 'repeated-back', type: 'button', onClick: props.onBack },
        'Back'
      ),
      React.createElement(
        'button',
        { 'data-testid': 'repeated-share', type: 'button', onClick: props.onShare },
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

function createReadyState(collection = createCollectionState({})) {
  return {
    renderState: 'ready' as const,
    storageState: 'ready' as const,
    locale: 'en' as const,
    theme: 'system' as const,
    collection,
    toggleCollected: vi.fn<
      (pageId: string, stickerId: string) => Promise<{ state: 'ready'; value: typeof collection }>
    >(async () => ({
      state: 'ready' as const,
      value: collection
    })),
    setStickerQuantity: vi.fn<
      (
        pageId: string,
        stickerId: string,
        quantity: number
      ) => Promise<{ state: 'ready'; value: typeof collection }>
    >(async () => ({
      state: 'ready' as const,
      value: collection
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
}

describe('repeated route component', () => {
  it('returns null when app state is not ready', async () => {
    const { Route: RepeatedRoute } = await import('@/routes/repeated');
    const Component = RepeatedRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(AppStateContext.Provider, { value: null }, React.createElement(Component))
    );

    try {
      expect(mounted.container.querySelector('[data-testid="repeated-screen"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('returns null when app state exists but is loading', async () => {
    const { Route: RepeatedRoute } = await import('@/routes/repeated');
    const Component = RepeatedRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        {
          value: {
            ...createReadyState(createCollectionState({})),
            renderState: 'loading'
          } as never
        },
        React.createElement(Component)
      )
    );

    try {
      expect(mounted.container.querySelector('[data-testid="repeated-screen"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('loads directly from live app state and navigates back home', async () => {
    navigateMock.mockClear();
    repeatedScreenMock.mockClear();

    const { Route: RepeatedRoute } = await import('@/routes/repeated');
    const Component = RepeatedRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const readyState = createReadyState(
      createCollectionState({
        mex: {
          'MEX-1': 3,
          'MEX-2': 1
        },
        rsa: {
          'RSA-1': 2
        }
      })
    );

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: readyState as never },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="repeated-screen"]') !== null
      );

      const lastScreenProps = repeatedScreenMock.mock.calls.at(-1)?.[0];
      expect(lastScreenProps?.collection).toEqual(readyState.collection);
      expect(lastScreenProps?.state).toMatchObject({
        kind: 'ready',
        totalRepeatedCount: 3,
        sharePageIds: ['mex', 'rsa']
      });

      await lastScreenProps?.onSetStickerQuantity('mex', 'MEX-1', 4);
      expect(readyState.setStickerQuantity).toHaveBeenCalledWith('mex', 'MEX-1', 4);

      const back = mounted.container.querySelector(
        '[data-testid="repeated-back"]'
      ) as HTMLButtonElement;
      back.click();

      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });

      const share = mounted.container.querySelector(
        '[data-testid="repeated-share"]'
      ) as HTMLButtonElement;
      share.click();

      const shareNavigate = navigateMock.mock.calls.find(
        (call) => (call[0] as { to?: string }).to === '/repeated-share'
      )?.[0] as { to: string; search: { pages?: string; from?: string } } | undefined;

      expect(shareNavigate?.to).toBe('/repeated-share');
      expect(shareNavigate?.search.from).toBe('/repeated');
      expect(shareNavigate?.search.pages).toBe('mex,rsa');
    } finally {
      cleanup(mounted);
    }
  });

  it('opens repeated share without preselected pages when repeated state is empty', async () => {
    navigateMock.mockClear();
    repeatedScreenMock.mockClear();

    const { Route: RepeatedRoute } = await import('@/routes/repeated');
    const Component = RepeatedRoute.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const readyState = createReadyState(createCollectionState({}));

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: readyState as never },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="repeated-screen"]') !== null
      );

      const share = mounted.container.querySelector(
        '[data-testid="repeated-share"]'
      ) as HTMLButtonElement;
      share.click();

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/repeated-share',
        search: {
          from: '/repeated'
        }
      });
    } finally {
      cleanup(mounted);
    }
  });
});

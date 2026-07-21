import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { albumPages } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';
import type { CollectionState } from '@/services/collection-service';
import type { trackAnalyticsEvent } from '@/services/analytics-service';
import { waitForCondition } from '../helpers/async';
import { createCollectionState } from '../helpers/typed-factories';

type SharePreviewScreenMockProps = {
  payload: unknown;
  onBack: () => void;
  mode?: 'repeated';
};

const { navigateMock, trackAnalyticsEventMock, sharePreviewScreenMock } = vi.hoisted(() => ({
  navigateMock: vi.fn<(input: unknown) => void>(),
  trackAnalyticsEventMock: vi.fn<typeof trackAnalyticsEvent>(),
  sharePreviewScreenMock: vi.fn<(props: SharePreviewScreenMockProps) => void>()
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock('@/services/analytics-service', () => ({
  trackAnalyticsEvent: trackAnalyticsEventMock
}));

vi.mock('@/components/share/SharePreviewScreen', () => ({
  SharePreviewScreen: (props: SharePreviewScreenMockProps) => {
    sharePreviewScreenMock(props);

    return React.createElement(
      'button',
      {
        'data-testid': 'share-preview-screen',
        type: 'button',
        onClick: props.onBack
      },
      props.mode ?? 'missing'
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

function makeReadyState(collection: CollectionState) {
  return {
    collection,
    renderState: 'ready' as const,
    locale: 'en' as const,
    storageState: 'ready' as const,
    theme: 'system' as const,
    toggleCollected: async () => ({ state: 'ready' as const, value: collection }),
    setStickerQuantity: async () => ({ state: 'ready' as const, value: collection }),
    setLocale: async () => 'ready' as const,
    retryBootstrap: async () => {},
    resetAppData: async () => {},
    setTheme: async () => {},
    restoreCollection: async () => ({ state: 'ready' as const, value: collection }),
    markScannedStickersAsHave: async () => ({
      state: 'ready' as const,
      value: collection,
      updatedStickerIds: []
    })
  };
}

function makeLoadingState(collection: CollectionState) {
  return {
    ...makeReadyState(collection),
    renderState: 'loading' as const
  };
}

describe('share preview analytics routes', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    trackAnalyticsEventMock.mockClear();
    sharePreviewScreenMock.mockClear();
  });

  it('tracks missing share preview with share_mode missing', async () => {
    const mod = await import('@/routes/share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: makeReadyState(createCollectionState({})) },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
        'share_preview_generated',
        expect.objectContaining({
          share_mode: 'missing',
          selected_page_count: 1,
          selection_source_path: '/',
          total_missing_sticker_count: expect.any(Number)
        })
      );

      const sharePreviewProps = sharePreviewScreenMock.mock.calls.at(-1)?.[0];
      expect(sharePreviewProps?.mode).toBeUndefined();
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('tracks repeated share preview with repeated-only totals', async () => {
    const mod = await import('@/routes/repeated-share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/repeated' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        {
          value: makeReadyState(
            createCollectionState({
              mex: {
                'MEX-1': 3,
                'MEX-2': 2
              }
            })
          )
        },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('share_preview_generated', {
        share_mode: 'repeated',
        selected_page_count: 1,
        selection_source_path: '/repeated',
        total_repeated_sticker_count: 3
      });

      const sharePreviewProps = sharePreviewScreenMock.mock.calls.at(-1)?.[0];
      expect(sharePreviewProps?.mode).toBe('repeated');
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('redirects missing share preview back to selection when chosen pages have no missing stickers', async () => {
    const mod = await import('@/routes/share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '//unsafe' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mexPage = albumPages.find((page) => page.pageId === 'mex');

    if (!mexPage) {
      throw new Error('Expected Mexico page fixture');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        {
          value: makeReadyState(
            createCollectionState({
              mex: Object.fromEntries(mexPage.stickerIds.map((stickerId) => [stickerId, 1]))
            })
          )
        },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => navigateMock.mock.calls.length === 1);

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/share',
        search: {
          pages: 'mex',
          from: '/'
        },
        replace: true
      });
      expect(sharePreviewScreenMock).not.toHaveBeenCalled();
      expect(trackAnalyticsEventMock).not.toHaveBeenCalled();
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('navigates missing share preview back with sanitized source path', async () => {
    const mod = await import('@/routes/share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '//unsafe' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: makeReadyState(createCollectionState({})) },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      const previewButton = mounted.container.querySelector(
        '[data-testid="share-preview-screen"]'
      ) as HTMLButtonElement;
      previewButton.click();

      expect(navigateMock.mock.calls.at(-1)?.[0]).toEqual({
        to: '/share',
        search: {
          pages: 'mex',
          from: '/'
        }
      });
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('tracks missing preview only once for equivalent rerenders', async () => {
    const mod = await import('@/routes/share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/missing' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: makeReadyState(createCollectionState({})) },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      mounted.root.render(
        React.createElement(
          AppStateContext.Provider,
          { value: makeReadyState(createCollectionState({})) },
          React.createElement(Component)
        )
      );

      await new Promise((resolve) => {
        window.setTimeout(resolve, 30);
      });

      expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(1);
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('waits for app readiness before tracking missing preview during bootstrap', async () => {
    const mod = await import('@/routes/share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/missing' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: makeLoadingState(createCollectionState({})) },
        React.createElement(Component)
      )
    );

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 30);
      });

      expect(navigateMock).not.toHaveBeenCalled();
      expect(trackAnalyticsEventMock).not.toHaveBeenCalled();
      expect(sharePreviewScreenMock).not.toHaveBeenCalled();

      mounted.root.render(
        React.createElement(
          AppStateContext.Provider,
          { value: makeReadyState(createCollectionState({})) },
          React.createElement(Component)
        )
      );

      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(navigateMock).not.toHaveBeenCalled();
      expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(1);
      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('share_preview_generated', {
        share_mode: 'missing',
        selected_page_count: 1,
        selection_source_path: '/missing',
        total_missing_sticker_count: expect.any(Number)
      });
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('returns null when missing share preview route app state is unavailable', async () => {
    const mod = await import('@/routes/share/preview');
    const useSearchSpy = vi.spyOn(mod.Route, 'useSearch').mockReturnValue({ from: '/missing' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(AppStateContext.Provider, { value: null }, React.createElement(Component))
    );

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 30);
      });

      expect(mounted.container.querySelector('[data-testid="share-preview-screen"]')).toBeNull();
      expect(navigateMock).not.toHaveBeenCalled();
      expect(trackAnalyticsEventMock).not.toHaveBeenCalled();
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('navigates repeated share preview back with sanitized source path', async () => {
    const mod = await import('@/routes/repeated-share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '//unsafe' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        {
          value: makeReadyState(
            createCollectionState({
              mex: {
                'MEX-1': 2
              }
            })
          )
        },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      const previewButton = mounted.container.querySelector(
        '[data-testid="share-preview-screen"]'
      ) as HTMLButtonElement;
      previewButton.click();

      const backNavigate = navigateMock.mock.calls.at(-1)?.[0];
      expect(backNavigate).toEqual({
        to: '/repeated-share',
        search: {
          pages: 'mex',
          from: '/'
        }
      });
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('redirects repeated share preview back to selection when chosen pages have no repeated stickers', async () => {
    const mod = await import('@/routes/repeated-share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/repeated' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: makeReadyState(createCollectionState({})) },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => navigateMock.mock.calls.length === 1);

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/repeated-share',
        search: {
          pages: 'mex',
          from: '/repeated'
        },
        replace: true
      });
      expect(sharePreviewScreenMock).not.toHaveBeenCalled();
      expect(trackAnalyticsEventMock).not.toHaveBeenCalled();
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('tracks repeated preview only once for equivalent rerenders', async () => {
    const mod = await import('@/routes/repeated-share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/repeated' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        {
          value: makeReadyState(
            createCollectionState({
              mex: {
                'MEX-1': 3
              }
            })
          )
        },
        React.createElement(Component)
      )
    );

    try {
      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      mounted.root.render(
        React.createElement(
          AppStateContext.Provider,
          {
            value: makeReadyState(
              createCollectionState({
                mex: {
                  'MEX-1': 3
                }
              })
            )
          },
          React.createElement(Component)
        )
      );

      await new Promise((resolve) => {
        window.setTimeout(resolve, 30);
      });

      expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(1);
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('waits for app readiness before redirecting repeated preview during bootstrap', async () => {
    const mod = await import('@/routes/repeated-share/preview');
    const useSearchSpy = vi
      .spyOn(mod.Route, 'useSearch')
      .mockReturnValue({ pages: 'mex', from: '/repeated' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(
        AppStateContext.Provider,
        { value: makeLoadingState(createCollectionState({})) },
        React.createElement(Component)
      )
    );

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 30);
      });

      expect(navigateMock).not.toHaveBeenCalled();
      expect(sharePreviewScreenMock).not.toHaveBeenCalled();

      mounted.root.render(
        React.createElement(
          AppStateContext.Provider,
          {
            value: makeReadyState(
              createCollectionState({
                mex: {
                  'MEX-1': 2
                }
              })
            )
          },
          React.createElement(Component)
        )
      );

      await waitForCondition(() => trackAnalyticsEventMock.mock.calls.length === 1);

      expect(navigateMock).not.toHaveBeenCalled();
      expect(trackAnalyticsEventMock).toHaveBeenCalledWith('share_preview_generated', {
        share_mode: 'repeated',
        selected_page_count: 1,
        selection_source_path: '/repeated',
        total_repeated_sticker_count: 1
      });
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });

  it('returns null when repeated share preview route app state is unavailable', async () => {
    const mod = await import('@/routes/repeated-share/preview');
    const useSearchSpy = vi.spyOn(mod.Route, 'useSearch').mockReturnValue({ from: '/repeated' });
    const Component = mod.Route.options.component;

    if (!Component) {
      throw new Error('Route component is undefined');
    }

    const mounted = mount(
      React.createElement(AppStateContext.Provider, { value: null }, React.createElement(Component))
    );

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 30);
      });

      expect(mounted.container.querySelector('[data-testid="share-preview-screen"]')).toBeNull();
      expect(navigateMock).not.toHaveBeenCalled();
    } finally {
      useSearchSpy.mockRestore();
      cleanup(mounted);
    }
  });
});

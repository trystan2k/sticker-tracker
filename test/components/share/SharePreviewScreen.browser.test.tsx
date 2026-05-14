import { afterEach, describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { initializeI18n } from '@/i18n/config';

import type { SharePreviewPayload } from '@/components/share/share-state';
import type { PageId, StickerIdentifier } from '@/data/album';
import { SharePreviewScreen } from '@/components/share/SharePreviewScreen';

const renderSharePngMock = vi.fn<
  (...args: unknown[]) => Promise<{
    blob: Blob;
    fileName: string;
    width: number;
    height: number;
    scale: number;
  }>
>();

vi.mock('@/components/share/share-renderer', () => ({
  renderSharePng: (...args: unknown[]) => renderSharePngMock(...args)
}));

function mount(component: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(component);
  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

function makePayload(): SharePreviewPayload {
  return {
    selectedPageIds: ['mex' as PageId],
    selectedPageCount: 1,
    totalMissingStickerCount: 20,
    sections: [
      {
        sectionId: 'special',
        sectionLabel: 'Special',
        pages: [
          {
            pageId: 'mex' as PageId,
            title: 'mex',
            pageType: 'special',
            specialKey: 'fwc-opening',
            missingStickerIds: ['1', '2'] as unknown as readonly StickerIdentifier[],
            compressedMissingText: '1-2'
          }
        ]
      }
    ]
  };
}

function clickButtonByText(container: HTMLDivElement, text: string) {
  const button = [...container.querySelectorAll('button')].find((node) =>
    node.textContent?.includes(text)
  );

  if (!button) {
    throw new Error(`Button not found: ${text}`);
  }

  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function mockNavigatorShare(
  canShareImpl: (data?: ShareData) => boolean,
  shareImpl?: (data?: ShareData) => Promise<void>
) {
  const canShare = vi.fn<(data?: ShareData) => boolean>(canShareImpl);
  const share = vi
    .fn<(data?: ShareData) => Promise<void>>()
    .mockImplementation(shareImpl ?? (async () => Promise.resolve()));

  Object.defineProperty(window.navigator, 'canShare', {
    configurable: true,
    value: canShare
  });
  Object.defineProperty(window.navigator, 'share', {
    configurable: true,
    value: share
  });

  return { canShare, share };
}

afterEach(() => {
  vi.restoreAllMocks();
  renderSharePngMock.mockReset();
});

describe('SharePreviewScreen', () => {
  it('renders with valid payload', async () => {
    await initializeI18n('en');

    renderSharePngMock.mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/png' }),
      fileName: 'test.png',
      width: 320,
      height: 400,
      scale: 2
    });

    const payload = makePayload();
    const onBack = vi.fn<() => void>();

    const mounted = mount(React.createElement(SharePreviewScreen, { payload, onBack }));

    try {
      await new Promise((r) => setTimeout(r, 30));

      const text = mounted.container.textContent;
      expect(text).toContain('Preview');
      expect(text).toContain('COPA 26');
      expect(text).toContain('Share');
      expect(text).toContain('Download');
    } finally {
      cleanup(mounted);
    }
  });

  it('uses Web Share API when canShare supports files', async () => {
    await initializeI18n('en');

    renderSharePngMock.mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/png' }),
      fileName: 'test.png',
      width: 320,
      height: 400,
      scale: 2
    });

    const { canShare, share } = mockNavigatorShare(() => true);

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

    const mounted = mount(
      React.createElement(SharePreviewScreen, {
        payload: makePayload(),
        onBack: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));
      clickButtonByText(mounted.container, 'Share');
      await new Promise((r) => setTimeout(r, 60));

      expect(canShare).toHaveBeenCalledTimes(1);
      expect(share).toHaveBeenCalledTimes(1);
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('falls back to download when canShare returns false', async () => {
    await initializeI18n('en');

    renderSharePngMock.mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/png' }),
      fileName: 'test.png',
      width: 320,
      height: 400,
      scale: 2
    });

    const { canShare, share } = mockNavigatorShare(() => false);

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const mounted = mount(
      React.createElement(SharePreviewScreen, {
        payload: makePayload(),
        onBack: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));
      clickButtonByText(mounted.container, 'Share');
      await new Promise((r) => setTimeout(r, 180));

      expect(canShare).toHaveBeenCalledTimes(1);
      expect(share).not.toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(mounted.container.textContent).toContain(
        'Share not available, file downloaded instead'
      );
    } finally {
      cleanup(mounted);
    }
  });

  it('shows error status when share fails', async () => {
    await initializeI18n('en');

    renderSharePngMock.mockRejectedValue(new Error('render failed'));

    mockNavigatorShare(() => true);

    const mounted = mount(
      React.createElement(SharePreviewScreen, {
        payload: makePayload(),
        onBack: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));
      clickButtonByText(mounted.container, 'Share');
      await new Promise((r) => setTimeout(r, 60));

      expect(mounted.container.textContent).toContain('Something went wrong');
    } finally {
      cleanup(mounted);
    }
  });
});

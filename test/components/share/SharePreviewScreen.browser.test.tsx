import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { initializeI18n } from '@/i18n/config';

import type { SharePreviewPayload } from '@/components/share/share-state';
import type { PageId, StickerIdentifier } from '@/data/album';
import { SharePreviewScreen } from '@/components/share/SharePreviewScreen';

// Mock the share renderer to avoid canvas dependency
vi.mock('@/components/share/share-renderer', () => ({
  renderSharePng: vi
    .fn<
      (...args: unknown[]) => Promise<{
        blob: Blob;
        fileName: string;
        width: number;
        height: number;
        scale: number;
      }>
    >()
    .mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/png' }),
      fileName: 'test.png',
      width: 320,
      height: 400,
      scale: 2
    })
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

describe('SharePreviewScreen', () => {
  it('renders with valid payload', async () => {
    await initializeI18n('en');

    const payload = makePayload();
    const onBack = vi.fn<() => void>();

    const mounted = mount(React.createElement(SharePreviewScreen, { payload, onBack }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('Preview');
      expect(text).toContain('COPA 26');
    } finally {
      cleanup(mounted);
    }
  });

  it('handles back button navigation', async () => {
    await initializeI18n('en');

    const payload = makePayload();
    const onBack = vi.fn<() => void>();

    const mounted = mount(React.createElement(SharePreviewScreen, { payload, onBack }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      const buttons = mounted.container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(onBack).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders share and download buttons', async () => {
    await initializeI18n('en');

    const payload = makePayload();
    const onBack = vi.fn<() => void>();

    const mounted = mount(React.createElement(SharePreviewScreen, { payload, onBack }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('Share');
      expect(text).toContain('Download');
    } finally {
      cleanup(mounted);
    }
  });
});

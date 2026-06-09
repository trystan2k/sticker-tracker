import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { initializeI18n } from '@/i18n/config';

import type { SharePreviewPayload } from '@/components/share/share-state';
import type { PageId, StickerIdentifier } from '@/data/album';
import { SharePreviewCard } from '@/components/share/SharePreviewCard';

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

function makePayload(overrides: Partial<SharePreviewPayload> = {}): SharePreviewPayload {
  return {
    selectedPageIds: [],
    selectedPageCount: 0,
    totalStickerCount: 0,
    sections: [],
    ...overrides
  };
}

function makeT(key: string): string {
  if (key === 'share.preview.ariaLabel') return 'Share preview';
  if (key === 'share.preview.subtitle') return 'Missing stickers';
  if (key === 'share.preview.emptyTitle') return 'No pages selected';
  if (key === 'share.preview.emptyDescription') return 'Select pages to share';
  if (key === 'share.repeated.preview.ariaLabel') return 'Repeated preview';
  if (key === 'share.repeated.preview.subtitle') return 'Repeated Stickers';
  if (key === 'share.repeated.preview.emptyTitle') return 'No repeated stickers';
  if (key === 'share.repeated.preview.emptyDescription') return 'No repeated stickers selected.';
  if (key === 'share.brandName') return 'COPA 26';
  if (key === 'share.brandDomain') return 'https://sticker-tracker.pages.dev';

  return `Page: ${key}`;
}

describe('SharePreviewCard', () => {
  it('renders preview card with payload containing pages', async () => {
    await initializeI18n('en');

    const payload = makePayload({
      selectedPageIds: ['mex' as PageId],
      selectedPageCount: 1,
      totalStickerCount: 20,
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
              stickerIds: ['1', '2'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: '1-2'
            }
          ]
        }
      ]
    });

    const mounted = mount(React.createElement(SharePreviewCard, { payload, t: makeT }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('COPA 26');
      expect(text).toContain('https://sticker-tracker.pages.dev');
      expect(text).toContain('Page: mex');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows empty state when payload has no pages', async () => {
    await initializeI18n('en');

    const payload = makePayload();

    const mounted = mount(React.createElement(SharePreviewCard, { payload, t: makeT }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('No pages selected');
      expect(text).toContain('Select pages to share');
    } finally {
      cleanup(mounted);
    }
  });

  it('displays correct page titles for team pages', async () => {
    await initializeI18n('en');

    const payload = makePayload({
      sections: [
        {
          sectionId: 'group-a',
          sectionLabel: 'Group A',
          pages: [
            {
              pageId: 'arg' as PageId,
              title: 'arg',
              pageType: 'team',
              flagCode: 'ar',
              group: 'A',
              stickerIds: ['ARG-1'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: '1'
            }
          ]
        }
      ]
    });

    const mounted = mount(React.createElement(SharePreviewCard, { payload, t: makeT }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      expect(mounted.container.textContent).toContain('Page: arg');
    } finally {
      cleanup(mounted);
    }
  });

  it('displays missing text with prefix', async () => {
    await initializeI18n('en');

    const payload = makePayload({
      sections: [
        {
          sectionId: 'special',
          sectionLabel: 'Special',
          pages: [
            {
              pageId: 'coca-cola' as PageId,
              title: 'coca-cola',
              pageType: 'special',
              specialKey: 'coca-cola',
              stickerIds: ['CC1', 'CC2'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'CC1-CC2'
            }
          ]
        }
      ]
    });

    const mounted = mount(React.createElement(SharePreviewCard, { payload, t: makeT }));

    try {
      await new Promise((r) => setTimeout(r, 50));

      expect(mounted.container.textContent).toContain('CC1-CC2');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders repeated mode labels and formatted repeated entries', async () => {
    await initializeI18n('en');

    const payload = makePayload({
      sections: [
        {
          sectionId: 'group-c',
          sectionLabel: 'Group C',
          pages: [
            {
              pageId: 'bra' as PageId,
              title: 'team.bra',
              pageType: 'team',
              flagCode: 'br',
              group: 'C',
              stickerIds: ['BRA-10'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'BRA 10 (x2)'
            }
          ]
        }
      ]
    });

    const mounted = mount(
      React.createElement(SharePreviewCard, { payload, t: makeT, mode: 'repeated' })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      expect(mounted.container.textContent).toContain('Repeated Stickers');
      expect(mounted.container.textContent).toContain('BRA 10 (x2)');
    } finally {
      cleanup(mounted);
    }
  });
});

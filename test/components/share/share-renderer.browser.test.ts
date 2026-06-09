import { describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import type { SharePreviewPayload } from '@/components/share/share-state';
import { renderSharePng } from '@/components/share/share-renderer';

function createPayload(): SharePreviewPayload {
  return {
    selectedPageIds: ['mex' as PageId],
    selectedPageCount: 1,
    totalStickerCount: 5,
    sections: [
      {
        sectionId: 'group-a',
        sectionLabel: 'album.quickNavigation.sections.group-a',
        pages: [
          {
            pageId: 'mex' as PageId,
            title: 'team.mex',
            flagCode: 'mx',
            group: 'A',
            pageType: 'team',
            stickerIds: [
              'MEX-1',
              'MEX-2',
              'MEX-3',
              'MEX-5',
              'MEX-10'
            ] as unknown as readonly StickerIdentifier[],
            compressedStickerText: 'MEX 1, MEX 2, MEX 3, MEX 5, MEX 10'
          }
        ]
      }
    ]
  };
}

function t(key: string): string {
  const map: Record<string, string> = {
    'team.mex': 'México',
    'share.preview.subtitle': 'Missing Stickers',
    'share.preview.emptyTitle': 'No missing stickers',
    'share.preview.emptyDescription': 'Everything complete.',
    'share.brandName': 'COPA 26',
    'share.brandDomain': 'https://sticker-tracker.pages.dev',
    'share.fileName': 'copa26-missing-stickers.png'
  };

  return map[key] ?? key;
}

describe('renderSharePng', () => {
  it('renders png blob for payload', async () => {
    const result = await renderSharePng(createPayload(), t, { preferredScale: 2 });

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe('image/png');
    expect(result.fileName).toBe('copa26-missing-stickers.png');
    expect(result.scale).toBe(2);
    expect(result.width).toBe(640);
    expect(result.height).toBeGreaterThan(0);
  });

  it('clamps scale when pixel limits smaller than preferred', async () => {
    const result = await renderSharePng(createPayload(), t, {
      preferredScale: 5,
      maxPixelWidth: 960,
      maxPixelHeight: 8192
    });

    expect(result.scale).toBe(3);
    expect(result.width).toBe(960);
  });

  it('throws when constraints force scale below 1', async () => {
    await expect(
      renderSharePng(createPayload(), t, {
        preferredScale: 2,
        maxPixelWidth: 200,
        maxPixelHeight: 200
      })
    ).rejects.toThrow('card exceeds maximum pixel constraints');
  });

  it('renders minimal card for empty payload', async () => {
    const emptyPayload: SharePreviewPayload = {
      selectedPageIds: [],
      selectedPageCount: 0,
      totalStickerCount: 0,
      sections: []
    };

    const result = await renderSharePng(emptyPayload, t, { preferredScale: 1 });

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.scale).toBe(1);
    expect(result.width).toBe(320);
    expect(result.height).toBeGreaterThan(0);
  });

  it('renders block with showFlag false when page has no flagCode', async () => {
    const payload: SharePreviewPayload = {
      selectedPageIds: ['special-1' as PageId],
      selectedPageCount: 1,
      totalStickerCount: 2,
      sections: [
        {
          sectionId: 'specials',
          sectionLabel: 'Specials',
          pages: [
            {
              pageId: 'special-1' as PageId,
              title: 'share.preview.emptyTitle',
              pageType: 'special',
              stickerIds: ['S-1', 'S-2'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'FWC 1, FWC 2'
            }
          ]
        }
      ]
    };

    const result = await renderSharePng(payload, t, { preferredScale: 1 });
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it('renders divider between blocks when payload has multiple pages', async () => {
    const payload: SharePreviewPayload = {
      selectedPageIds: ['mex' as PageId, 'arg' as PageId],
      selectedPageCount: 2,
      totalStickerCount: 6,
      sections: [
        {
          sectionId: 'group-a',
          sectionLabel: 'Group A',
          pages: [
            {
              pageId: 'mex' as PageId,
              title: 'team.mex',
              flagCode: 'mx',
              group: 'A',
              pageType: 'team',
              stickerIds: ['MEX-1', 'MEX-2', 'MEX-3'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'MEX 1, MEX 2, MEX 3'
            },
            {
              pageId: 'arg' as PageId,
              title: 'team.arg',
              flagCode: 'ar',
              group: 'A',
              pageType: 'team',
              stickerIds: ['ARG-1', 'ARG-2', 'ARG-3'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'ARG 1, ARG 2, ARG 3'
            }
          ]
        }
      ]
    };

    const result = await renderSharePng(payload, t, { preferredScale: 1 });
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe('image/png');
  });

  it('throws when canvas 2d context is unavailable', async () => {
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(renderSharePng(createPayload(), t)).rejects.toThrow(
      'Unable to render PNG: 2D canvas context unavailable.'
    );

    getContextSpy.mockRestore();
  });

  it('renders block with cocacola flagCode (specialKey coca-cola)', async () => {
    const payload: SharePreviewPayload = {
      selectedPageIds: ['coca-cola' as PageId],
      selectedPageCount: 1,
      totalStickerCount: 2,
      sections: [
        {
          sectionId: 'special',
          sectionLabel: 'Special',
          pages: [
            {
              pageId: 'coca-cola' as PageId,
              title: 'share.preview.emptyTitle',
              pageType: 'special',
              specialKey: 'coca-cola',
              stickerIds: ['CC1', 'CC2'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'CC 1, CC 2'
            }
          ]
        }
      ]
    };

    const result = await renderSharePng(payload, t, { preferredScale: 1 });
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe('image/png');
  });

  it('throws when canvas toBlob returns null', async () => {
    const toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function mockToBlob(callback: BlobCallback) {
        callback(null);
      });

    await expect(renderSharePng(createPayload(), t)).rejects.toThrow('Unable to render PNG blob.');

    toBlobSpy.mockRestore();
  });

  it('uses repeated mode file name and labels', async () => {
    const payload: SharePreviewPayload = {
      selectedPageIds: ['bra' as PageId],
      selectedPageCount: 1,
      totalStickerCount: 2,
      sections: [
        {
          sectionId: 'group-c',
          sectionLabel: 'Group C',
          pages: [
            {
              pageId: 'bra' as PageId,
              title: 'team.bra',
              flagCode: 'br',
              group: 'C',
              pageType: 'team',
              stickerIds: ['BRA-10'] as unknown as readonly StickerIdentifier[],
              compressedStickerText: 'BRA 10 (x2)'
            }
          ]
        }
      ]
    };

    const repeatedT = (key: string): string => {
      const map: Record<string, string> = {
        'team.bra': 'Brazil',
        'share.repeated.preview.subtitle': 'Repeated Stickers',
        'share.repeated.preview.emptyTitle': 'No repeated stickers',
        'share.repeated.preview.emptyDescription': 'No repeated stickers selected.',
        'share.brandName': 'COPA 26',
        'share.brandDomain': 'https://sticker-tracker.pages.dev',
        'share.repeated.fileName': 'copa26-repeated-stickers.png'
      };

      return map[key] ?? key;
    };

    const result = await renderSharePng(payload, repeatedT, { preferredScale: 1 }, 'repeated');

    expect(result.fileName).toBe('copa26-repeated-stickers.png');
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it('expands repeated-share block height for long wrapped sticker lines', async () => {
    const payload: SharePreviewPayload = {
      selectedPageIds: ['bra' as PageId],
      selectedPageCount: 1,
      totalStickerCount: 14,
      sections: [
        {
          sectionId: 'group-c',
          sectionLabel: 'Group C',
          pages: [
            {
              pageId: 'bra' as PageId,
              title: 'team.bra',
              flagCode: 'br',
              group: 'C',
              pageType: 'team',
              stickerIds: [
                'BRA-1',
                'BRA-2',
                'BRA-3',
                'BRA-4',
                'BRA-5',
                'BRA-6',
                'BRA-7'
              ] as unknown as readonly StickerIdentifier[],
              compressedStickerText:
                'BRA 1 (x2), BRA 2 (x2), BRA 3 (x2), BRA 4 (x2), BRA 5 (x2), BRA 6 (x2), BRA 7 (x2)'
            }
          ]
        }
      ]
    };

    const repeatedT = (key: string): string => {
      const map: Record<string, string> = {
        'team.bra': 'Brazil',
        'share.repeated.preview.subtitle': 'Repeated Stickers',
        'share.repeated.preview.emptyTitle': 'No repeated stickers',
        'share.repeated.preview.emptyDescription': 'No repeated stickers selected.',
        'share.brandName': 'COPA 26',
        'share.brandDomain': 'https://sticker-tracker.pages.dev',
        'share.repeated.fileName': 'copa26-repeated-stickers.png'
      };

      return map[key] ?? key;
    };

    const result = await renderSharePng(payload, repeatedT, { preferredScale: 1 }, 'repeated');

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.height).toBeGreaterThan(195);
  });
});

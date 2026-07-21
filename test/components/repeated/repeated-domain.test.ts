import { describe, expect, it } from 'vitest';

import { albumPages, type AlbumPage, type PageId, type StickerIdentifier } from '@/data/album';
import {
  countRepeatedStickersForPage,
  formatRepeatedShareEntry,
  getRepeatedPageSummary,
  getRepeatedStickerIds
} from '@/components/repeated/repeated-domain';
import type { CollectionState } from '@/services/collection-service';

function makeCollection(
  entries: Record<string, string[] | Record<string, number>>
): CollectionState {
  const result: Record<string, Record<StickerIdentifier, number>> = {};

  for (const [pageId, stickerState] of Object.entries(entries)) {
    result[pageId] = Array.isArray(stickerState)
      ? Object.fromEntries(
          stickerState.map((stickerId) => [stickerId as StickerIdentifier, 1] as const)
        )
      : Object.fromEntries(
          Object.entries(stickerState).map(([stickerId, quantity]) => [
            stickerId as StickerIdentifier,
            quantity
          ])
        );
  }

  return result;
}

function getPage(pageId: PageId): AlbumPage {
  const page = albumPages.find((candidate) => candidate.pageId === pageId);

  if (!page) {
    throw new Error(`Missing test page: ${pageId}`);
  }

  return page;
}

describe('repeated-domain', () => {
  it('returns only sticker ids with repeated copies', () => {
    const collection = makeCollection({
      mex: {
        'MEX-1': 1,
        'MEX-2': 2,
        'MEX-3': 4
      }
    });

    expect(getRepeatedStickerIds(collection, 'mex' as PageId)).toEqual([
      'MEX-2' as StickerIdentifier,
      'MEX-3' as StickerIdentifier
    ]);
  });

  it('returns empty repeated results for unknown pages', () => {
    const collection = makeCollection({
      mex: {
        'MEX-2': 2
      }
    });

    expect(getRepeatedStickerIds(collection, 'unknown' as PageId)).toEqual([]);
    expect(countRepeatedStickersForPage(collection, 'unknown' as PageId)).toBe(0);
    expect(getRepeatedPageSummary(collection, 'unknown' as PageId)).toEqual({
      repeatedStickerIds: [],
      repeatedCount: 0
    });
  });

  it('summarizes repeated ids and repeated count for known pages', () => {
    const collection = makeCollection({
      mex: {
        'MEX-1': 1,
        'MEX-2': 2,
        'MEX-3': 4
      }
    });

    expect(countRepeatedStickersForPage(collection, 'mex' as PageId)).toBe(4);
    expect(getRepeatedPageSummary(collection, 'mex' as PageId)).toEqual({
      repeatedStickerIds: ['MEX-2' as StickerIdentifier, 'MEX-3' as StickerIdentifier],
      repeatedCount: 4
    });
  });

  it('formats team repeated share entries with album code and numeric suffix', () => {
    expect(
      formatRepeatedShareEntry(getPage('mex' as PageId), 'MEX-12' as StickerIdentifier, 3)
    ).toBe('MEX 12 (x2)');
  });

  it('formats coca-cola repeated share entries with CC prefix', () => {
    expect(
      formatRepeatedShareEntry(getPage('coca-cola' as PageId), 'CC12' as StickerIdentifier, 2)
    ).toBe('CC 12 (x1)');
  });

  it('formats fifa special repeated share entries with FWC prefix and raw id fallback', () => {
    expect(
      formatRepeatedShareEntry(getPage('fwc-opening' as PageId), '00' as StickerIdentifier, 1)
    ).toBe('FWC 00 (x0)');
  });
});

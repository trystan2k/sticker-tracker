import { describe, expect, it } from 'vitest';

import { albumPages, type PageId, type StickerIdentifier } from '@/data/album';
import {
  SWIPE_THRESHOLD_PX,
  applyStickerFilter,
  derivePageSectionRuns,
  getActivePage,
  getNextPage,
  getPrevPage
} from '@/components/album-viewer/viewer-state';

describe('viewer-state helpers', () => {
  it('exports named swipe threshold constant', () => {
    expect(SWIPE_THRESHOLD_PX).toBeTypeOf('number');
    expect(SWIPE_THRESHOLD_PX).toBeGreaterThan(0);
  });

  it('returns active page from page id', () => {
    const page = getActivePage('mex' as PageId);
    expect(page.pageId).toBe('mex');
  });

  it('returns next page in album order with wraparound', () => {
    const nextFromOpening = getNextPage('fwc-opening' as PageId);
    expect(nextFromOpening.pageId).toBe('mex');

    const nextFromLast = getNextPage('coca-cola' as PageId);
    expect(nextFromLast.pageId).toBe('fwc-opening');
  });

  it('returns previous page in album order with wraparound', () => {
    const prevFromFirst = getPrevPage('fwc-opening' as PageId);
    expect(prevFromFirst.pageId).toBe('coca-cola');

    const prevFromMex = getPrevPage('mex' as PageId);
    expect(prevFromMex.pageId).toBe('fwc-opening');
  });

  it('derives order-preserving section runs without reordering', () => {
    const runs = derivePageSectionRuns();

    expect(runs.length).toBeGreaterThan(2);
    expect(runs[0]?.sectionId).toBe('special-fwc-opening');
    expect(runs[0]?.pages[0]?.pageId).toBe('fwc-opening');

    const firstGroupRun = runs[1];
    expect(firstGroupRun?.sectionId).toBe('group-A');
    expect(firstGroupRun?.pages[0]?.pageId).toBe('mex');

    const lastGroupRun = runs.find((run) => run.sectionId === 'group-L');
    expect(lastGroupRun?.sectionId).toBe('group-L');
    expect(lastGroupRun?.pages.at(-1)?.pageId).toBe('pan');

    const finalSpecialRun = runs.at(-1);
    expect(finalSpecialRun?.sectionId).toBe('special-coca-cola');
    expect(runs.at(-2)?.sectionId).toBe('special-fwc-closing');
    expect(runs.at(-2)?.pages.map((page) => page.pageId)).toEqual(['fwc-closing']);
    expect(finalSpecialRun?.pages.map((page) => page.pageId)).toEqual(['coca-cola']);
  });

  it('keeps fwc-closing near album end', () => {
    const index = albumPages.findIndex((page) => page.pageId === 'fwc-closing');
    expect(index).toBe(albumPages.length - 2);
  });

  it('applies all/collected/missing filters preserving sticker order', () => {
    const stickerIds = ['A-1', 'A-2', 'A-3', 'A-4'] as unknown as readonly StickerIdentifier[];
    const collected = new Set<StickerIdentifier>([
      'A-2' as StickerIdentifier,
      'A-4' as StickerIdentifier
    ]);

    expect(applyStickerFilter(stickerIds, collected, 'all')).toEqual(stickerIds);
    expect(applyStickerFilter(stickerIds, collected, 'collected')).toEqual(['A-2', 'A-4']);
    expect(applyStickerFilter(stickerIds, collected, 'missing')).toEqual(['A-1', 'A-3']);
  });

  it('returns empty list when collected or missing filter has no matches', () => {
    const stickerIds = ['A-1', 'A-2'] as unknown as readonly StickerIdentifier[];
    const noneCollected = new Set<StickerIdentifier>();
    const allCollected = new Set<StickerIdentifier>([
      'A-1' as StickerIdentifier,
      'A-2' as StickerIdentifier
    ]);

    expect(applyStickerFilter(stickerIds, noneCollected, 'collected')).toEqual([]);
    expect(applyStickerFilter(stickerIds, allCollected, 'missing')).toEqual([]);
  });
});

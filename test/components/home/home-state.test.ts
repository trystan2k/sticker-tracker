import { describe, expect, it } from 'vitest';

import {
  ALBUM_TOTAL,
  COCA_COLA_COUNT,
  FWC_CLOSING_COUNT,
  FWC_OPENING_COUNT,
  GROUP_LIST
} from '@/data/album';
import type { CollectionState } from '@/services/collection-service';
import type { PageId, StickerIdentifier } from '@/data/album';

import {
  computeHomeSummary,
  computeGroupsData,
  computeSpecialPagesData
} from '@/components/home/home-state';

function makeCollection(entries: Record<string, string[]>): CollectionState {
  const result: Record<string, ReadonlySet<StickerIdentifier>> = {};
  for (const [pageId, stickerIds] of Object.entries(entries)) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    result[pageId] = new Set(stickerIds) as unknown as ReadonlySet<StickerIdentifier>;
  }
  return result as unknown as CollectionState;
}

describe('home-state', () => {
  describe('computeHomeSummary', () => {
    it('returns zero for empty collection', () => {
      const summary = computeHomeSummary({});
      expect(summary.collectedTotal).toBe(0);
      expect(summary.albumTotal).toBe(ALBUM_TOTAL);
      expect(summary.percentage).toBe(0);
    });

    it('computes partial collection correctly', () => {
      const collection = makeCollection({
        mex: ['MEX-1', 'MEX-2', 'MEX-3']
      });
      const summary = computeHomeSummary(collection);
      expect(summary.collectedTotal).toBe(3);
      expect(summary.percentage).toBeGreaterThan(0);
      expect(summary.percentage).toBeLessThan(100);
    });

    it('computes full collection as 100%', () => {
      // Create entries that sum to more than ALBUM_TOTAL
      const oversized: Record<string, ReadonlySet<StickerIdentifier>> = {};
      // Create entries that sum to more than ALBUM_TOTAL
      for (let i = 0; i < ALBUM_TOTAL + 100; i++) {
        const pageId = `page-${i % 51}` as PageId;
        if (!oversized[pageId]) {
          oversized[pageId] = new Set<StickerIdentifier>();
        }
        (oversized[pageId] as Set<StickerIdentifier>).add(`sticker-${i}` as StickerIdentifier);
      }
      const summary = computeHomeSummary(oversized as unknown as CollectionState);
      expect(summary.percentage).toBe(100);
    });

    it('handles collection with missing page IDs (pages not in collection)', () => {
      const collection = makeCollection({
        mex: ['MEX-1']
        // All other pages missing
      });
      const summary = computeHomeSummary(collection);
      expect(summary.collectedTotal).toBe(1);
      expect(summary.percentage).toBeGreaterThan(0);
    });
  });

  describe('computeGroupsData', () => {
    it('returns data for all groups', () => {
      const groups = computeGroupsData({});
      expect(groups.length).toBe(GROUP_LIST.length);
      expect(groups.map((g) => g.group)).toEqual([...GROUP_LIST]);
    });

    it('computes zero collected for empty collection', () => {
      const groups = computeGroupsData({});
      for (const group of groups) {
        expect(group.collected).toBe(0);
        expect(group.total).toBeGreaterThan(0);
        expect(group.percentage).toBe(0);
        expect(group.isComplete).toBe(false);
        expect(group.teams.length).toBeGreaterThan(0);
      }
    });

    it('computes partial collection for a group', () => {
      const collection = makeCollection({
        mex: ['MEX-1', 'MEX-2', 'MEX-3', 'MEX-4', 'MEX-5']
      });
      const groups = computeGroupsData(collection);
      const groupA = groups.find((g) => g.group === 'A')!;
      expect(groupA.collected).toBe(5);
      expect(groupA.percentage).toBeGreaterThan(0);
      expect(groupA.percentage).toBeLessThan(100);
      expect(groupA.isComplete).toBe(false);
    });

    it('marks group as complete when all stickers collected', () => {
      // Collect all stickers from group A (4 teams * 20 stickers = 80)
      const teamPages = ['mex', 'rsa', 'kor', 'cze'];
      const entries: Record<string, string[]> = {};
      for (const team of teamPages) {
        entries[team] = Array.from({ length: 20 }, (_, i) => `${team.toUpperCase()}-${i + 1}`);
      }
      const collection = makeCollection(entries);
      const groups = computeGroupsData(collection);
      const groupA = groups.find((g) => g.group === 'A')!;
      expect(groupA.collected).toBe(80);
      expect(groupA.total).toBe(80);
      expect(groupA.percentage).toBe(100);
      expect(groupA.isComplete).toBe(true);
    });

    it('provides firstPagePath for navigation', () => {
      const groups = computeGroupsData({});
      const groupA = groups.find((g) => g.group === 'A')!;
      expect(groupA.firstPagePath).toBe('/album/A/mex');
    });

    it('provides path for each team', () => {
      const groups = computeGroupsData({});
      const groupA = groups.find((g) => g.group === 'A')!;
      expect(groupA.teams[0]?.path).toBe('/album/A/mex');
    });

    it('maps team data correctly', () => {
      const groups = computeGroupsData({});
      const groupA = groups.find((g) => g.group === 'A')!;
      expect(groupA.teams.length).toBe(4);
      expect(groupA.teams[0]?.albumCode).toBe('MEX');
      expect(groupA.teams[0]?.pageId).toBe('mex' as PageId);
      expect(groupA.teams[0]?.collected).toBe(0);
      expect(groupA.teams[0]?.total).toBe(20);
      expect(groupA.teams[0]?.percentage).toBe(0);
      expect(groupA.teams[0]?.isComplete).toBe(false);
    });

    it('maps team progress stats for partial collection', () => {
      const groups = computeGroupsData(
        makeCollection({
          mex: ['MEX-1', 'MEX-2', 'MEX-3']
        })
      );
      const groupA = groups.find((g) => g.group === 'A')!;
      const mex = groupA.teams.find((team) => team.pageId === ('mex' as PageId));
      expect(mex).toMatchObject({
        collected: 3,
        total: 20,
        isComplete: false
      });
      expect(mex!.percentage).toBeGreaterThan(0);
      expect(mex!.percentage).toBeLessThan(100);
    });
  });

  describe('computeSpecialPagesData', () => {
    it('returns data for all special pages', () => {
      const special = computeSpecialPagesData({});
      expect(special.length).toBe(3);
      const keys = special.map((s) => s.key);
      expect(keys).toContain('fwc-opening');
      expect(keys).toContain('fwc-closing');
      expect(keys).toContain('coca-cola');
    });

    it('computes zero collected for empty collection', () => {
      const special = computeSpecialPagesData({});
      for (const card of special) {
        expect(card.collected).toBe(0);
        expect(card.isComplete).toBe(false);
      }
    });

    it('returns correct totals for each special page', () => {
      const special = computeSpecialPagesData({});
      const opening = special.find((s) => s.key === 'fwc-opening')!;
      const closing = special.find((s) => s.key === 'fwc-closing')!;
      const cocaCola = special.find((s) => s.key === 'coca-cola')!;

      expect(opening.total).toBe(FWC_OPENING_COUNT);
      expect(closing.total).toBe(FWC_CLOSING_COUNT);
      expect(cocaCola.total).toBe(COCA_COLA_COUNT);
    });

    it('computes partial collection for special pages', () => {
      const collection = makeCollection({
        'fwc-opening': ['00', '1', '2', '3']
      });
      const special = computeSpecialPagesData(collection);
      const opening = special.find((s) => s.key === 'fwc-opening')!;
      expect(opening.collected).toBe(4);
      expect(opening.percentage).toBeGreaterThan(0);
      expect(opening.isComplete).toBe(false);
    });

    it('marks special page as complete when all collected', () => {
      const collection = makeCollection({
        'fwc-opening': ['00', '1', '2', '3', '4', '5', '6', '7', '8']
      });
      const special = computeSpecialPagesData(collection);
      const opening = special.find((s) => s.key === 'fwc-opening')!;
      expect(opening.collected).toBe(FWC_OPENING_COUNT);
      expect(opening.percentage).toBe(100);
      expect(opening.isComplete).toBe(true);
    });

    it('preserves raw special-page collected count above total', () => {
      const collection = makeCollection({
        'fwc-opening': Array.from({ length: 20 }, (_, index) => `X-${index + 1}`)
      });
      const special = computeSpecialPagesData(collection);
      const opening = special.find((s) => s.key === 'fwc-opening')!;

      expect(opening.collected).toBe(20);
      expect(opening.percentage).toBe(100);
      expect(opening.isComplete).toBe(true);
    });

    it('handles missing page IDs in collection gracefully', () => {
      const collection = makeCollection({
        'nonexistent-page': ['1', '2']
      });
      const special = computeSpecialPagesData(collection);
      // Special pages should still show 0 collected since nonexistent-page isn't a special page
      for (const card of special) {
        expect(card.collected).toBe(0);
      }
    });
  });
});

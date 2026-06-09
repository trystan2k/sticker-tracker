import { describe, expect, it } from 'vitest';

import { albumPages, type PageId, type StickerIdentifier } from '@/data/album';
import {
  computeGroupStatsFromTeamStats,
  computeGroupStats,
  computeTeamStats,
  rankIncompleteGroupsByLeastProgress,
  rankIncompleteGroupsByMostProgress,
  rankIncompleteTeamsByLeastProgress,
  rankIncompleteTeamsByMostProgress
} from '@/data/album-stats';
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

  return result as unknown as CollectionState;
}

describe('album-stats', () => {
  it('computes team stats only from team pages', () => {
    const stats = computeTeamStats(
      makeCollection({
        mex: ['MEX-1', 'MEX-2', 'MEX-3'],
        'fwc-opening': ['00', '1', '2'],
        'coca-cola': ['CC1', 'CC2'],
        unknown: ['X-1']
      })
    );

    expect(stats).toHaveLength(48);

    const mex = stats.find((team) => team.pageId === ('mex' as PageId));
    expect(mex).toMatchObject({
      pageId: 'mex',
      group: 'A',
      collected: 3,
      total: 20,
      isComplete: false
    });

    const rsa = stats.find((team) => team.pageId === ('rsa' as PageId));
    expect(rsa).toMatchObject({
      collected: 0,
      total: 20,
      percentage: 0,
      isComplete: false
    });
  });

  it('computes group stats in canonical GROUP_LIST order', () => {
    const stats = computeGroupStats(
      makeCollection({
        mex: ['MEX-1', 'MEX-2', 'MEX-3'],
        rsa: ['RSA-1', 'RSA-2']
      })
    );

    expect(stats).toHaveLength(12);
    expect(stats.map((group) => group.group)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L'
    ]);

    const groupA = stats.find((group) => group.group === 'A');
    expect(groupA).toMatchObject({
      collected: 5,
      total: 80,
      isComplete: false
    });
  });

  it('computes group stats from precomputed team stats without recalculating selectors', () => {
    const collection = makeCollection({
      mex: ['MEX-1', 'MEX-2', 'MEX-3'],
      rsa: ['RSA-1', 'RSA-2']
    });

    const teamStats = computeTeamStats(collection);
    const fromCollection = computeGroupStats(collection);
    const fromTeamStats = computeGroupStatsFromTeamStats(teamStats);

    expect(fromTeamStats).toEqual(fromCollection);
  });

  it('clamps corrupted collected counts above team total', () => {
    const stats = computeTeamStats(
      makeCollection({
        mex: Object.fromEntries(
          Array.from({ length: 25 }, (_, index) => [`MEX-${(index % 20) + 1}`, 2] as const)
        )
      })
    );

    const mex = stats.find((team) => team.pageId === ('mex' as PageId));
    expect(mex).toMatchObject({
      collected: 20,
      total: 20,
      percentage: 100,
      isComplete: true
    });
  });

  it('excludes completed teams from both ranking ends and keeps album-order ties', () => {
    const teamStats = computeTeamStats(
      makeCollection({
        mex: Array.from({ length: 20 }, (_, index) => `MEX-${index + 1}`),
        rsa: ['RSA-1', 'RSA-2', 'RSA-3', 'RSA-4'],
        kor: ['KOR-1', 'KOR-2', 'KOR-3', 'KOR-4'],
        cze: ['CZE-1']
      })
    );

    const most = rankIncompleteTeamsByMostProgress(teamStats);
    const least = rankIncompleteTeamsByLeastProgress(teamStats);

    expect(most[0]?.pageId).toBe('rsa');
    expect(most[1]?.pageId).toBe('kor');
    expect(most.some((team) => team.pageId === ('mex' as PageId))).toBe(false);

    expect(least[0]?.pageId).toBe('can');
    expect(least.some((team) => team.pageId === ('mex' as PageId))).toBe(false);
  });

  it('excludes completed groups from both ranking ends and keeps GROUP_LIST-order ties', () => {
    const groupStats = computeGroupStats(
      makeCollection({
        mex: Array.from({ length: 20 }, (_, index) => `MEX-${index + 1}`),
        rsa: Array.from({ length: 20 }, (_, index) => `RSA-${index + 1}`),
        kor: Array.from({ length: 20 }, (_, index) => `KOR-${index + 1}`),
        cze: Array.from({ length: 20 }, (_, index) => `CZE-${index + 1}`),
        can: ['CAN-1', 'CAN-2', 'CAN-3', 'CAN-4'],
        bih: ['BIH-1', 'BIH-2', 'BIH-3', 'BIH-4'],
        bra: ['BRA-1', 'BRA-2', 'BRA-3', 'BRA-4'],
        mar: ['MAR-1', 'MAR-2', 'MAR-3', 'MAR-4']
      })
    );

    const most = rankIncompleteGroupsByMostProgress(groupStats);
    const least = rankIncompleteGroupsByLeastProgress(groupStats);

    expect(most[0]?.group).toBe('B');
    expect(most[1]?.group).toBe('C');
    expect(most.some((group) => group.group === 'A')).toBe(false);

    expect(least[0]?.group).toBe('D');
    expect(least.some((group) => group.group === 'A')).toBe(false);
  });

  it('returns empty ranking when every team and group is complete', () => {
    const entries: Record<string, string[]> = {};

    for (const teamPage of albumPages) {
      if (teamPage.type !== 'team') {
        continue;
      }

      entries[teamPage.pageId] = Array.from(
        { length: 20 },
        (_, index) => `${teamPage.albumCode}-${index + 1}`
      );
    }

    const teamStats = computeTeamStats(makeCollection(entries));
    const groupStats = computeGroupStats(makeCollection(entries));

    expect(rankIncompleteTeamsByMostProgress(teamStats)).toEqual([]);
    expect(rankIncompleteTeamsByLeastProgress(teamStats)).toEqual([]);
    expect(rankIncompleteGroupsByMostProgress(groupStats)).toEqual([]);
    expect(rankIncompleteGroupsByLeastProgress(groupStats)).toEqual([]);
  });

  it('clamps invalid group percentages from injected team stats', () => {
    const groupStats = computeGroupStatsFromTeamStats([
      {
        pageId: 'mex' as PageId,
        group: 'A',
        collected: 100,
        total: 20,
        percentage: 500,
        isComplete: true
      }
    ]);

    const groupA = groupStats.find((group) => group.group === 'A');
    expect(groupA).toMatchObject({
      collected: 100,
      total: 20,
      percentage: 100,
      isComplete: true
    });
  });

  it('keeps ranking stable when team id is outside canonical order map', () => {
    const ranked = rankIncompleteTeamsByMostProgress([
      {
        pageId: 'unknown-team' as PageId,
        group: 'A',
        collected: 1,
        total: 20,
        percentage: 5,
        isComplete: false
      },
      {
        pageId: 'mex' as PageId,
        group: 'A',
        collected: 1,
        total: 20,
        percentage: 5,
        isComplete: false
      }
    ]);

    expect(ranked[0]?.pageId).toBe('mex');
    expect(ranked[1]?.pageId).toBe('unknown-team');
  });
});

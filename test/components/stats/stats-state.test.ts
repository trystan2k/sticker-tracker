import { describe, expect, it } from 'vitest';

import { GROUP_LIST, albumPages } from '@/data/album';
import { buildStatsState } from '@/components/stats/stats-state';
import { createCollectionState } from '../../helpers/typed-factories';

describe('stats-state', () => {
  it('returns zero-progress state when no team has collected stickers', () => {
    const state = buildStatsState(createCollectionState({}));

    expect(state.kind).toBe('zero-progress');
  });

  it('returns all-complete state when all teams are completed', () => {
    const allTeamsEntries: Record<string, string[]> = {};

    for (const page of albumPages) {
      if (page.type !== 'team') {
        continue;
      }

      allTeamsEntries[page.pageId] = Array.from(
        { length: 20 },
        (_, index) => `${page.albumCode}-${index + 1}`
      );
    }

    const state = buildStatsState(createCollectionState(allTeamsEntries));

    expect(state.kind).toBe('all-complete');
  });

  it('excludes completed teams/groups from highlights and keeps deterministic ties', () => {
    const state = buildStatsState(
      createCollectionState({
        mex: Array.from({ length: 20 }, (_, index) => `MEX-${index + 1}`),
        kor: Array.from({ length: 20 }, (_, index) => `KOR-${index + 1}`),
        cze: Array.from({ length: 20 }, (_, index) => `CZE-${index + 1}`),
        rsa: Array.from({ length: 20 }, (_, index) => `RSA-${index + 1}`),
        can: ['CAN-1', 'CAN-2', 'CAN-3', 'CAN-4'],
        bih: ['BIH-1', 'BIH-2', 'BIH-3', 'BIH-4'],
        bra: ['BRA-1', 'BRA-2', 'BRA-3', 'BRA-4'],
        mar: ['MAR-1', 'MAR-2', 'MAR-3', 'MAR-4']
      })
    );

    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') {
      return;
    }

    expect(state.teams.moreStickers.pageId).toBe('can');
    expect(state.teams.lessStickers.pageId).toBe('qat');
    expect(state.teams.moreStickers.pageId).not.toBe('mex');
    expect(state.teams.moreStickers.collected).toBe(4);
    expect(state.teams.moreStickers.total).toBe(20);
    expect(state.teams.lessStickers.collected).toBe(0);
    expect(state.teams.lessStickers.total).toBe(20);

    expect(state.groups.moreStickers.group).toBe('B');
    expect(state.groups.lessStickers.group).toBe('D');
    expect(state.completedGroups).toEqual(['A']);
    expect(state.incompleteGroups[0]).toBe('B');
  });

  it('keeps incomplete groups in canonical order', () => {
    const state = buildStatsState(
      createCollectionState({
        mex: ['MEX-1']
      })
    );

    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') {
      return;
    }

    expect(state.incompleteGroups).toEqual(GROUP_LIST);
  });

  it('ignores repeated copies when ranking progress', () => {
    const state = buildStatsState(
      createCollectionState({
        mex: {
          'MEX-1': 4,
          'MEX-2': 3,
          'MEX-3': 1
        }
      })
    );

    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') {
      return;
    }

    expect(state.teams.moreStickers.pageId).toBe('mex');
    expect(state.teams.moreStickers.collected).toBe(3);
  });
});

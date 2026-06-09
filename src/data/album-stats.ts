import { GROUP_LIST, albumPages, type Group, type PageId, type TeamPage } from '@/data/album';
import { derivePageCollectedStickerIds, type CollectionState } from '@/services/collection-service';

export interface TeamStats {
  pageId: PageId;
  group: Group;
  collected: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export interface GroupStats {
  group: Group;
  collected: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

const TEAM_PAGES = albumPages.filter((page): page is TeamPage => page.type === 'team');
const TEAM_ORDER_INDEX = new Map(TEAM_PAGES.map((page, index) => [page.pageId, index]));
const GROUP_ORDER_INDEX = new Map(GROUP_LIST.map((group, index) => [group, index]));

function clampPercentage(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

function clampCollectedCount(collected: number, total: number): number {
  if (collected < 0) {
    return 0;
  }

  if (collected > total) {
    return total;
  }

  return collected;
}

function compareByTeamOrder(left: TeamStats, right: TeamStats): number {
  return (
    (TEAM_ORDER_INDEX.get(left.pageId) ?? Number.MAX_SAFE_INTEGER) -
    (TEAM_ORDER_INDEX.get(right.pageId) ?? Number.MAX_SAFE_INTEGER)
  );
}

function compareByGroupOrder(left: GroupStats, right: GroupStats): number {
  return (
    (GROUP_ORDER_INDEX.get(left.group) ?? Number.MAX_SAFE_INTEGER) -
    (GROUP_ORDER_INDEX.get(right.group) ?? Number.MAX_SAFE_INTEGER)
  );
}

export function computeTeamStats(collection: CollectionState): TeamStats[] {
  return TEAM_PAGES.map((page) => {
    const rawCollected = derivePageCollectedStickerIds(collection, page.pageId).size;
    const total = page.stickerIds.length;
    const collected = clampCollectedCount(rawCollected, total);
    const percentage = clampPercentage(total === 0 ? 0 : (collected / total) * 100);

    return {
      pageId: page.pageId,
      group: page.group,
      collected,
      total,
      percentage,
      isComplete: collected >= total
    };
  });
}

export function computeGroupStatsFromTeamStats(teamStats: readonly TeamStats[]): GroupStats[] {
  return GROUP_LIST.map((group) => {
    const groupTeamStats = teamStats.filter((team) => team.group === group);
    const collected = groupTeamStats.reduce((total, team) => total + team.collected, 0);
    const total = groupTeamStats.reduce((sum, team) => sum + team.total, 0);
    const percentage = clampPercentage(total === 0 ? 0 : (collected / total) * 100);

    return {
      group,
      collected,
      total,
      percentage,
      isComplete: collected >= total
    };
  });
}

export function computeGroupStats(collection: CollectionState): GroupStats[] {
  return computeGroupStatsFromTeamStats(computeTeamStats(collection));
}

export function rankIncompleteTeamsByMostProgress(teamStats: readonly TeamStats[]): TeamStats[] {
  return teamStats
    .filter((team) => !team.isComplete)
    .toSorted((left, right) => {
      if (right.percentage !== left.percentage) {
        return right.percentage - left.percentage;
      }

      return compareByTeamOrder(left, right);
    });
}

export function rankIncompleteTeamsByLeastProgress(teamStats: readonly TeamStats[]): TeamStats[] {
  return teamStats
    .filter((team) => !team.isComplete)
    .toSorted((left, right) => {
      if (left.percentage !== right.percentage) {
        return left.percentage - right.percentage;
      }

      return compareByTeamOrder(left, right);
    });
}

export function rankIncompleteGroupsByMostProgress(
  groupStats: readonly GroupStats[]
): GroupStats[] {
  return groupStats
    .filter((group) => !group.isComplete)
    .toSorted((left, right) => {
      if (right.percentage !== left.percentage) {
        return right.percentage - left.percentage;
      }

      return compareByGroupOrder(left, right);
    });
}

export function rankIncompleteGroupsByLeastProgress(
  groupStats: readonly GroupStats[]
): GroupStats[] {
  return groupStats
    .filter((group) => !group.isComplete)
    .toSorted((left, right) => {
      if (left.percentage !== right.percentage) {
        return left.percentage - right.percentage;
      }

      return compareByGroupOrder(left, right);
    });
}

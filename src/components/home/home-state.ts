import {
  ALBUM_TOTAL,
  COCA_COLA_COUNT,
  FWC_CLOSING_COUNT,
  FWC_OPENING_COUNT,
  albumPages,
  type Group,
  type PageId,
  type SpecialPage,
  type TeamPage
} from '@/data/album';
import { computeGroupStatsFromTeamStats, computeTeamStats } from '@/data/album-stats';
import { getAlbumPath } from '@/components/album-viewer/viewer-state';
import {
  countUniqueCollectedStickers,
  derivePageCollectedStickerIds,
  type CollectionState
} from '@/services/collection-service';

export interface HomeSummary {
  collectedTotal: number;
  albumTotal: number;
  percentage: number;
}

export interface GroupCardData {
  group: Group;
  label: string;
  collected: number;
  total: number;
  percentage: number;
  isComplete: boolean;
  teams: {
    albumCode: string;
    flagCode: string;
    name: string;
    pageId: PageId;
    path: string;
    collected: number;
    total: number;
    percentage: number;
    isComplete: boolean;
  }[];
  firstPagePath: string;
}

export interface SpecialCardData {
  pageId: PageId;
  key: 'fwc-opening' | 'fwc-closing' | 'coca-cola';
  translationKey: string;
  collected: number;
  total: number;
  percentage: number;
  isComplete: boolean;
  path: string;
}

function clampPercentage(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

function getTeamPagesByGroup(group: Group): readonly TeamPage[] {
  return albumPages.filter(
    (page): page is TeamPage => page.type === 'team' && page.group === group
  );
}

function getSpecialTotalByKey(page: SpecialPage): number {
  switch (page.key) {
    case 'fwc-opening':
      return FWC_OPENING_COUNT;
    case 'fwc-closing':
      return FWC_CLOSING_COUNT;
    case 'coca-cola':
      return COCA_COLA_COUNT;
    default: {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      throw new Error(`Unhandled special page key: ${(page as { key: string }).key}`);
    }
  }
}

export function computeHomeSummary(collection: CollectionState): HomeSummary {
  const collectedTotal = countUniqueCollectedStickers(collection);
  const albumTotal = ALBUM_TOTAL;
  const percentage = clampPercentage((collectedTotal / albumTotal) * 100);

  return {
    collectedTotal,
    albumTotal,
    percentage
  };
}

export function computeGroupsData(collection: CollectionState): GroupCardData[] {
  const teamStats = computeTeamStats(collection);
  const groupStats = computeGroupStatsFromTeamStats(teamStats);
  const teamStatsByPageId = new Map(teamStats.map((stats) => [stats.pageId, stats]));

  return groupStats.map((groupStat) => {
    const group = groupStat.group;
    const groupTeams = getTeamPagesByGroup(group);
    const firstTeamPage = groupTeams[0];

    if (!firstTeamPage) {
      throw new Error(`Group ${group} has no team pages configured.`);
    }

    return {
      group,
      label: `group.label`,
      collected: groupStat.collected,
      total: groupStat.total,
      percentage: groupStat.percentage,
      isComplete: groupStat.isComplete,
      teams: groupTeams.map((teamPage) => {
        const stats = teamStatsByPageId.get(teamPage.pageId);

        if (!stats) {
          throw new Error(`Team page ${teamPage.pageId} has no computed stats.`);
        }

        return {
          albumCode: teamPage.albumCode,
          flagCode: teamPage.flagCode,
          name: teamPage.translationKey,
          pageId: teamPage.pageId,
          path: getAlbumPath(teamPage),
          collected: stats.collected,
          total: stats.total,
          percentage: stats.percentage,
          isComplete: stats.isComplete
        };
      }),
      firstPagePath: getAlbumPath(firstTeamPage)
    };
  });
}

export function computeSpecialPagesData(collection: CollectionState): SpecialCardData[] {
  const specialPages = albumPages.filter((page): page is SpecialPage => page.type === 'special');

  return specialPages.map((page) => {
    const collected = derivePageCollectedStickerIds(collection, page.pageId).size;
    const total = getSpecialTotalByKey(page);
    const percentage = clampPercentage(total === 0 ? 0 : (collected / total) * 100);

    return {
      pageId: page.pageId,
      key: page.key,
      translationKey: page.translationKey,
      collected,
      total,
      percentage,
      isComplete: collected >= total,
      path: getAlbumPath(page)
    };
  });
}

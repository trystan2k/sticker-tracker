import {
  ALBUM_TOTAL,
  COCA_COLA_COUNT,
  FWC_CLOSING_COUNT,
  FWC_OPENING_COUNT,
  GROUP_LIST,
  albumPages,
  type Group,
  type PageId,
  type SpecialPage,
  type TeamPage
} from '@/data/album';
import { getAlbumPath } from '@/components/album-viewer/viewer-state';
import type { CollectionState } from '@/services/collection-service';

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
  const collectedTotal = Object.values(collection).reduce((total, stickers) => {
    return total + stickers.size;
  }, 0);
  const albumTotal = ALBUM_TOTAL;
  const percentage = clampPercentage((collectedTotal / albumTotal) * 100);

  return {
    collectedTotal,
    albumTotal,
    percentage
  };
}

export function computeGroupsData(collection: CollectionState): GroupCardData[] {
  return GROUP_LIST.map((group) => {
    const groupTeams = getTeamPagesByGroup(group);
    const firstTeamPage = groupTeams[0];

    if (!firstTeamPage) {
      throw new Error(`Group ${group} has no team pages configured.`);
    }

    const collected = groupTeams.reduce((total, teamPage) => {
      return total + (collection[teamPage.pageId]?.size ?? 0);
    }, 0);
    const total = groupTeams.reduce((sum, teamPage) => sum + teamPage.stickerIds.length, 0);
    const percentage = clampPercentage(total === 0 ? 0 : (collected / total) * 100);

    return {
      group,
      label: `group.label`,
      collected,
      total,
      percentage,
      isComplete: collected >= total,
      teams: groupTeams.map((teamPage) => ({
        albumCode: teamPage.albumCode,
        flagCode: teamPage.flagCode,
        name: teamPage.translationKey,
        pageId: teamPage.pageId,
        path: getAlbumPath(teamPage)
      })),
      firstPagePath: getAlbumPath(firstTeamPage)
    };
  });
}

export function computeSpecialPagesData(collection: CollectionState): SpecialCardData[] {
  const specialPages = albumPages.filter((page): page is SpecialPage => page.type === 'special');

  return specialPages.map((page) => {
    const collected = collection[page.pageId]?.size ?? 0;
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

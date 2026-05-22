import {
  STICKERS_PER_GROUP,
  STICKERS_PER_TEAM,
  albumPages,
  type Group,
  type PageId
} from '@/data/album';
import {
  computeGroupStatsFromTeamStats,
  computeTeamStats,
  rankIncompleteGroupsByLeastProgress,
  rankIncompleteGroupsByMostProgress,
  rankIncompleteTeamsByLeastProgress,
  rankIncompleteTeamsByMostProgress
} from '@/data/album-stats';
import type { CollectionState } from '@/services/collection-service';

type TeamMetadata = {
  albumCode: string;
  group: Group;
  flagCode: string;
  translationKey: string;
};

type StatsTeamHighlight = {
  pageId: PageId;
  albumCode: string;
  group: Group;
  flagCode: string;
  translationKey: string;
  collected: number;
  total: number;
};

type StatsGroupHighlight = {
  group: Group;
  collected: number;
  total: number;
};

export type StatsState =
  | {
      kind: 'zero-progress' | 'all-complete';
    }
  | {
      kind: 'ready';
      teams: {
        moreStickers: StatsTeamHighlight;
        lessStickers: StatsTeamHighlight;
      };
      groups: {
        moreStickers: StatsGroupHighlight;
        lessStickers: StatsGroupHighlight;
      };
      completedGroups: readonly Group[];
      incompleteGroups: readonly Group[];
    };

const TEAM_META_BY_PAGE_ID = new Map<PageId, TeamMetadata>(
  albumPages
    .filter((page) => page.type === 'team')
    .map((teamPage) => [
      teamPage.pageId,
      {
        albumCode: teamPage.albumCode,
        group: teamPage.group,
        flagCode: teamPage.flagCode,
        translationKey: teamPage.translationKey
      }
    ])
);

function toTeamHighlight(pageId: PageId, collected: number): StatsTeamHighlight {
  const metadata = TEAM_META_BY_PAGE_ID.get(pageId);

  if (!metadata) {
    throw new Error(`Unknown team page for stats: ${pageId}`);
  }

  return {
    pageId,
    albumCode: metadata.albumCode,
    group: metadata.group,
    flagCode: metadata.flagCode,
    translationKey: metadata.translationKey,
    collected,
    total: STICKERS_PER_TEAM
  };
}

function toGroupHighlight(group: Group, collected: number): StatsGroupHighlight {
  return {
    group,
    collected,
    total: STICKERS_PER_GROUP
  };
}

export function buildStatsState(collection: CollectionState): StatsState {
  const teamStats = computeTeamStats(collection);
  const groupStats = computeGroupStatsFromTeamStats(teamStats);

  const zeroProgress = teamStats.every((team) => team.collected === 0);
  if (zeroProgress) {
    return {
      kind: 'zero-progress'
    };
  }

  const allComplete = teamStats.every((team) => team.isComplete);
  if (allComplete) {
    return {
      kind: 'all-complete'
    };
  }

  const teamsMost = rankIncompleteTeamsByMostProgress(teamStats);
  const teamsLeast = rankIncompleteTeamsByLeastProgress(teamStats);
  const groupsMost = rankIncompleteGroupsByMostProgress(groupStats);
  const groupsLeast = rankIncompleteGroupsByLeastProgress(groupStats);

  const topTeam = teamsMost[0];
  const lowTeam = teamsLeast[0];
  const topGroup = groupsMost[0];
  const lowGroup = groupsLeast[0];

  if (!topTeam || !lowTeam || !topGroup || !lowGroup) {
    throw new Error('Stats rankings unavailable for ready state.');
  }

  const completedGroups = groupStats
    .filter((group) => group.isComplete)
    .map((group) => group.group);
  const incompleteGroups = groupStats
    .filter((group) => !group.isComplete)
    .map((group) => group.group);

  return {
    kind: 'ready',
    teams: {
      moreStickers: toTeamHighlight(topTeam.pageId, topTeam.collected),
      lessStickers: toTeamHighlight(lowTeam.pageId, lowTeam.collected)
    },
    groups: {
      moreStickers: toGroupHighlight(topGroup.group, topGroup.collected),
      lessStickers: toGroupHighlight(lowGroup.group, lowGroup.collected)
    },
    completedGroups,
    incompleteGroups
  };
}

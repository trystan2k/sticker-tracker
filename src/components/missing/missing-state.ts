import {
  ALBUM_TOTAL,
  albumPages,
  type AlbumPage,
  type PageId,
  type StickerIdentifier
} from '@/data/album';
import type { CollectionState } from '@/services/collection-service';

type MissingPageBlock = {
  pageId: PageId;
  translationKey: string;
  pageType: AlbumPage['type'];
  missingStickerIds: readonly StickerIdentifier[];
  missingCount: number;
  totalCount: number;
  flagCode?: string;
  group?: string;
  specialKey?: string;
};

export type MissingState =
  | {
      kind: 'all-complete';
      totalMissingCount: 0;
      collectedCount: number;
      albumTotal: number;
      pages: readonly [];
      sharePageIds: readonly [];
    }
  | {
      kind: 'ready';
      totalMissingCount: number;
      collectedCount: number;
      albumTotal: number;
      pages: readonly MissingPageBlock[];
      sharePageIds: readonly PageId[];
    };

function getMissingStickerIds(
  page: AlbumPage,
  collectedByPage: ReadonlySet<StickerIdentifier>,
  hiddenStickerIds: ReadonlySet<StickerIdentifier>
): readonly StickerIdentifier[] {
  return page.stickerIds.filter(
    (stickerId) => !collectedByPage.has(stickerId) && !hiddenStickerIds.has(stickerId)
  );
}

function countCollectedStickers(collection: CollectionState): number {
  return Object.values(collection).reduce((total, stickerIds) => total + stickerIds.size, 0);
}

export function buildMissingState(
  collection: CollectionState,
  options?: {
    hiddenStickerIds?: ReadonlySet<StickerIdentifier>;
  }
): MissingState {
  const hiddenStickerIds = options?.hiddenStickerIds ?? new Set<StickerIdentifier>();

  const pages: MissingPageBlock[] = [];

  for (const page of albumPages) {
    const collectedByPage = collection[page.pageId] ?? new Set<StickerIdentifier>();
    const missingStickerIds = getMissingStickerIds(page, collectedByPage, hiddenStickerIds);

    if (missingStickerIds.length === 0) {
      continue;
    }

    if (page.type === 'team') {
      pages.push({
        pageId: page.pageId,
        translationKey: page.translationKey,
        pageType: page.type,
        missingStickerIds,
        missingCount: missingStickerIds.length,
        totalCount: page.stickerIds.length,
        flagCode: page.flagCode,
        group: page.group
      });
      continue;
    }

    pages.push({
      pageId: page.pageId,
      translationKey: page.translationKey,
      pageType: page.type,
      missingStickerIds,
      missingCount: missingStickerIds.length,
      totalCount: page.stickerIds.length,
      specialKey: page.key
    });
  }

  const collectedCount = countCollectedStickers(collection);

  if (pages.length === 0) {
    return {
      kind: 'all-complete',
      pages: [],
      sharePageIds: [],
      totalMissingCount: 0,
      collectedCount,
      albumTotal: ALBUM_TOTAL
    };
  }

  return {
    kind: 'ready',
    pages,
    sharePageIds: pages.map((page) => page.pageId),
    totalMissingCount: pages.reduce((sum, page) => sum + page.missingCount, 0),
    collectedCount,
    albumTotal: ALBUM_TOTAL
  };
}

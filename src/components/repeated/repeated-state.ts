import { albumPages, type AlbumPage, type PageId, type StickerIdentifier } from '@/data/album';
import { countRepeatedCopies, type CollectionState } from '@/services/collection-service';

import { getRepeatedPageSummary } from './repeated-domain';

type RepeatedPageBlock = {
  pageId: PageId;
  translationKey: string;
  pageType: AlbumPage['type'];
  repeatedStickerIds: readonly StickerIdentifier[];
  repeatedCount: number;
  flagCode?: string;
  group?: string;
  specialKey?: string;
};

export type RepeatedState =
  | {
      kind: 'empty';
      totalRepeatedCount: 0;
      pages: readonly [];
      sharePageIds: readonly [];
    }
  | {
      kind: 'ready';
      totalRepeatedCount: number;
      pages: readonly RepeatedPageBlock[];
      sharePageIds: readonly PageId[];
    };

export function buildRepeatedState(collection: CollectionState): RepeatedState {
  const pages: RepeatedPageBlock[] = [];

  for (const page of albumPages) {
    const { repeatedStickerIds, repeatedCount } = getRepeatedPageSummary(collection, page.pageId);

    if (repeatedCount === 0) {
      continue;
    }

    if (page.type === 'team') {
      pages.push({
        pageId: page.pageId,
        translationKey: page.translationKey,
        pageType: page.type,
        repeatedStickerIds,
        repeatedCount,
        flagCode: page.flagCode,
        group: page.group
      });
      continue;
    }

    pages.push({
      pageId: page.pageId,
      translationKey: page.translationKey,
      pageType: page.type,
      repeatedStickerIds,
      repeatedCount,
      specialKey: page.key
    });
  }

  if (pages.length === 0) {
    return {
      kind: 'empty',
      totalRepeatedCount: 0,
      pages: [],
      sharePageIds: []
    };
  }

  return {
    kind: 'ready',
    totalRepeatedCount: countRepeatedCopies(collection),
    pages,
    sharePageIds: pages.map((page) => page.pageId)
  };
}

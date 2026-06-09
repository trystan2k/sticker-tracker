import { albumPages, type AlbumPage, type PageId, type StickerIdentifier } from '@/data/album';
import { getStickerRepeatedCount, type CollectionState } from '@/services/collection-service';

export const REPEATED_CANONICAL_PAGE_IDS = albumPages.map((page) => page.pageId);
export const REPEATED_PAGE_MAP = new Map<PageId, AlbumPage>(
  albumPages.map((page) => [page.pageId, page])
);

export function getRepeatedStickerIds(
  collection: CollectionState,
  pageId: PageId
): readonly StickerIdentifier[] {
  const page = REPEATED_PAGE_MAP.get(pageId);

  if (!page) {
    return [];
  }

  return page.stickerIds.filter(
    (stickerId) => getStickerRepeatedCount(collection, pageId, stickerId) > 0
  );
}

export function countRepeatedStickersForPage(collection: CollectionState, pageId: PageId): number {
  const page = REPEATED_PAGE_MAP.get(pageId);

  if (!page) {
    return 0;
  }

  return page.stickerIds.reduce(
    (sum, stickerId) => sum + getStickerRepeatedCount(collection, pageId, stickerId),
    0
  );
}

export function getRepeatedPageSummary(
  collection: CollectionState,
  pageId: PageId
): Readonly<{
  repeatedStickerIds: readonly StickerIdentifier[];
  repeatedCount: number;
}> {
  const page = REPEATED_PAGE_MAP.get(pageId);

  if (!page) {
    return {
      repeatedStickerIds: [],
      repeatedCount: 0
    };
  }

  const repeatedStickerIds: StickerIdentifier[] = [];
  let repeatedCount = 0;

  for (const stickerId of page.stickerIds) {
    const repeatedStickerCount = getStickerRepeatedCount(collection, pageId, stickerId);

    if (repeatedStickerCount <= 0) {
      continue;
    }

    repeatedStickerIds.push(stickerId);
    repeatedCount += repeatedStickerCount;
  }

  return {
    repeatedStickerIds,
    repeatedCount
  };
}

function getRepeatedDisplayCode(page: AlbumPage, stickerId: StickerIdentifier): string {
  if (page.type === 'team') {
    return page.albumCode;
  }

  if (String(stickerId).startsWith('CC')) {
    return 'CC';
  }

  return 'FWC';
}

function getRepeatedDisplayNumber(stickerId: StickerIdentifier): string {
  const value = String(stickerId);

  if (/^[A-Z]{3}-\d+$/.test(value)) {
    return value.split('-')[1] ?? value;
  }

  if (/^CC\d+$/.test(value)) {
    return value.slice(2);
  }

  return value;
}

export function formatRepeatedShareEntry(
  page: AlbumPage,
  stickerId: StickerIdentifier,
  quantity: number
): string {
  const repeatedCount = Math.max(0, quantity - 1);

  return `${getRepeatedDisplayCode(page, stickerId)} ${getRepeatedDisplayNumber(stickerId)} (x${repeatedCount})`;
}

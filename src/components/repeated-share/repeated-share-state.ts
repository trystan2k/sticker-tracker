import { PAGE_SECTION_RUNS, isValidPageId } from '@/components/album-viewer/viewer-state';
import {
  countRepeatedStickersForPage,
  formatRepeatedShareEntry,
  getRepeatedStickerIds,
  REPEATED_CANONICAL_PAGE_IDS,
  REPEATED_PAGE_MAP
} from '@/components/repeated/repeated-domain';
import type {
  SharePreviewPayload,
  SharePreviewPageBlock,
  ShareRouteSearch,
  ShareSelectionSection
} from '@/components/share/share-state';
import type { PageId } from '@/data/album';
import { sanitizeFromPath } from '@/lib/sanitize-from-path';
import { getStickerQuantity, type CollectionState } from '@/services/collection-service';

export { formatRepeatedShareEntry } from '@/components/repeated/repeated-domain';

function createRepeatedSelectionRow(collection: CollectionState, pageId: PageId) {
  const page = REPEATED_PAGE_MAP.get(pageId);

  if (!page) {
    throw new Error(`Invalid page id: ${pageId}`);
  }

  const base = {
    pageId,
    title: page.translationKey,
    pageType: page.type,
    stickerCount: countRepeatedStickersForPage(collection, pageId)
  } as const;

  if (page.type === 'team') {
    return {
      ...base,
      flagCode: page.flagCode,
      group: page.group
    };
  }

  return {
    ...base,
    specialKey: page.key
  };
}

function createRepeatedPreviewPageBlock(
  collection: CollectionState,
  pageId: PageId
): SharePreviewPageBlock {
  const page = REPEATED_PAGE_MAP.get(pageId);

  if (!page) {
    throw new Error(`Invalid page id: ${pageId}`);
  }

  const repeatedStickerIds = getRepeatedStickerIds(collection, pageId);
  const compressedStickerText = repeatedStickerIds
    .map((stickerId) =>
      formatRepeatedShareEntry(page, stickerId, getStickerQuantity(collection, pageId, stickerId))
    )
    .join(', ');

  const base = {
    pageId,
    title: page.translationKey,
    pageType: page.type,
    stickerIds: repeatedStickerIds,
    compressedStickerText
  } as const;

  if (page.type === 'team') {
    return {
      ...base,
      flagCode: page.flagCode,
      group: page.group
    };
  }

  return {
    ...base,
    specialKey: page.key
  };
}

export function buildRepeatedShareSelectionSections(
  collection: CollectionState
): readonly ShareSelectionSection[] {
  return PAGE_SECTION_RUNS.map((run) => ({
    sectionId: run.sectionId,
    sectionLabel: `album.quickNavigation.sections.${run.sectionId}`,
    rows: run.pages.map((page) => createRepeatedSelectionRow(collection, page.pageId))
  }));
}

export function buildRepeatedSharePreviewPayload(
  collection: CollectionState,
  selectedPageIds: readonly PageId[]
): SharePreviewPayload {
  const selectedSet = new Set(selectedPageIds);
  const orderedSelectedPageIds = REPEATED_CANONICAL_PAGE_IDS.filter((pageId) =>
    selectedSet.has(pageId)
  );

  let totalRepeatedStickerCount = 0;

  const sections = PAGE_SECTION_RUNS.map((run) => {
    const pages = run.pages
      .filter((page) => selectedSet.has(page.pageId))
      .map((page) => createRepeatedPreviewPageBlock(collection, page.pageId))
      .filter((page) => page.stickerIds.length > 0);

    totalRepeatedStickerCount += pages.reduce(
      (sum, page) => sum + countRepeatedStickersForPage(collection, page.pageId),
      0
    );

    return {
      sectionId: run.sectionId,
      sectionLabel: `album.quickNavigation.sections.${run.sectionId}`,
      pages
    };
  }).filter((section) => section.pages.length > 0);

  return {
    selectedPageIds: orderedSelectedPageIds,
    selectedPageCount: sections.reduce((sum, section) => sum + section.pages.length, 0),
    totalStickerCount: totalRepeatedStickerCount,
    sections
  };
}

export function parseRepeatedShareRouteSearch(raw: Record<string, unknown>): ShareRouteSearch {
  return {
    ...(typeof raw.pages === 'string' ? { pages: raw.pages } : {}),
    from: sanitizeFromPath(typeof raw.from === 'string' ? raw.from : undefined, '/repeated')
  };
}

export function decodeRepeatedShareSelection(raw: string | undefined | null): readonly PageId[] {
  if (!raw) {
    return [];
  }

  const inputIds = raw
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0)
    .filter((token): token is PageId => isValidPageId(token));

  const selectedSet = new Set(inputIds);

  return REPEATED_CANONICAL_PAGE_IDS.filter((pageId) => selectedSet.has(pageId));
}

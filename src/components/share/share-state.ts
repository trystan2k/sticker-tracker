import { albumPages, type AlbumPage, type PageId, type StickerIdentifier } from '@/data/album';
import { isValidPageId, PAGE_SECTION_RUNS } from '@/components/album-viewer/viewer-state';
import { derivePageCollectedStickerIds, type CollectionState } from '@/services/collection-service';

export type ShareEntryPoint = { type: 'all-missing' } | { type: 'current-page'; pageId: PageId };

export type ShareRouteSearch = {
  pages?: string;
  from?: string;
};

type ShareSelectionRow = {
  pageId: PageId;
  title: string;
  flagCode?: string;
  group?: string;
  pageType: 'team' | 'special';
  specialKey?: string;
  stickerCount: number;
};

export type ShareSelectionSection = {
  sectionId: string;
  sectionLabel: string;
  rows: readonly ShareSelectionRow[];
};

export type SharePreviewPageBlock = {
  pageId: PageId;
  title: string;
  flagCode?: string;
  group?: string;
  pageType: 'team' | 'special';
  specialKey?: string;
  stickerIds: readonly StickerIdentifier[];
  compressedStickerText: string;
};

type SharePreviewSection = {
  sectionId: string;
  sectionLabel: string;
  pages: readonly SharePreviewPageBlock[];
};

export type SharePreviewPayload = {
  selectedPageIds: readonly PageId[];
  selectedPageCount: number;
  totalStickerCount: number;
  sections: readonly SharePreviewSection[];
};

const CANONICAL_PAGE_IDS = albumPages.map((page) => page.pageId);
const PAGE_MAP = new Map<PageId, AlbumPage>(albumPages.map((page) => [page.pageId, page]));

function getMissingStickerIds(
  collection: CollectionState,
  pageId: PageId
): readonly StickerIdentifier[] {
  const page = PAGE_MAP.get(pageId);

  if (!page) {
    return [];
  }

  const collected = derivePageCollectedStickerIds(collection, pageId);

  return page.stickerIds.filter((stickerId) => !collected.has(stickerId));
}

function getSectionLabel(sectionId: string): string {
  return `album.quickNavigation.sections.${sectionId}`;
}

function createSelectionRow(collection: CollectionState, pageId: PageId): ShareSelectionRow {
  const page = PAGE_MAP.get(pageId);

  if (!page) {
    throw new Error(`Invalid page id: ${pageId}`);
  }

  const base = {
    pageId,
    title: page.translationKey,
    pageType: page.type,
    stickerCount: getMissingStickerIds(collection, pageId).length
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

function createPreviewPageBlock(
  collection: CollectionState,
  pageId: PageId
): SharePreviewPageBlock {
  const page = PAGE_MAP.get(pageId);

  if (!page) {
    throw new Error(`Invalid page id: ${pageId}`);
  }

  const stickerIds = getMissingStickerIds(collection, pageId);

  const base = {
    pageId,
    title: page.translationKey,
    pageType: page.type,
    stickerIds,
    compressedStickerText: stickerIds
      .map((stickerId) => formatMissingShareEntry(page, stickerId))
      .join(', ')
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

export function buildInitialShareSelection(
  collection: CollectionState,
  entryPoint: ShareEntryPoint
): readonly PageId[] {
  if (entryPoint.type === 'all-missing') {
    return CANONICAL_PAGE_IDS.filter(
      (pageId) => getMissingStickerIds(collection, pageId).length > 0
    );
  }

  const missingStickerIds = getMissingStickerIds(collection, entryPoint.pageId);

  return missingStickerIds.length > 0 ? [entryPoint.pageId] : [];
}

export function buildShareSelectionSections(
  collection: CollectionState
): readonly ShareSelectionSection[] {
  return PAGE_SECTION_RUNS.map((run) => ({
    sectionId: run.sectionId,
    sectionLabel: getSectionLabel(run.sectionId),
    rows: run.pages.map((page) => createSelectionRow(collection, page.pageId))
  }));
}

export function parseShareRouteSearch(raw: Record<string, unknown>): ShareRouteSearch {
  return {
    ...(typeof raw.pages === 'string' ? { pages: raw.pages } : {}),
    ...(typeof raw.from === 'string' ? { from: raw.from } : {})
  };
}

export function compressMissingStickerIds(stickerIds: readonly StickerIdentifier[]): string {
  if (stickerIds.length === 0) {
    return '';
  }

  const values = stickerIds.map((value) => String(value));

  const isTeamPattern = values.every((value) => /^[A-Z]{3}-\d+$/.test(value));
  const isCcPattern = values.every((value) => /^CC\d+$/.test(value));
  const isNumericPattern = values.every((value) => /^\d+$/.test(value));

  let prefix = '';
  let numbers: number[] = [];

  if (isTeamPattern) {
    // Team stickers: strip prefix (team name shown in block title)
    numbers = values.map((value) => Number(value.split('-')[1]));
  } else if (isCcPattern) {
    prefix = 'CC';
    numbers = values.map((value) => Number(value.slice(2)));
  } else if (isNumericPattern) {
    const entries = [...new Set(values)].map((value) => ({
      raw: value,
      numeric: Number(value)
    }));
    const sortedEntries = entries.toSorted((left, right) => {
      if (left.numeric === right.numeric) {
        return left.raw.localeCompare(right.raw);
      }

      return left.numeric - right.numeric;
    });
    const parts: string[] = [];
    let index = 0;

    while (index < sortedEntries.length) {
      const startEntry = sortedEntries[index]!;
      let endEntry = startEntry;

      while (index + 1 < sortedEntries.length) {
        const nextEntry = sortedEntries[index + 1]!;

        if (nextEntry.numeric !== endEntry.numeric + 1) {
          break;
        }

        if (startEntry.raw.startsWith('0') || endEntry.raw.startsWith('0')) {
          if (nextEntry.raw.length !== endEntry.raw.length) {
            break;
          }
        }

        endEntry = nextEntry;
        index += 1;
      }

      if (startEntry.raw === endEntry.raw) {
        parts.push(startEntry.raw);
      } else {
        parts.push(`${startEntry.raw}-${endEntry.raw}`);
      }

      index += 1;
    }

    return parts.join(', ');
  } else {
    return values.join(', ');
  }

  const sortedNumbers = [...new Set(numbers)].toSorted((left, right) => left - right);
  const parts: string[] = [];
  let index = 0;

  while (index < sortedNumbers.length) {
    const start = sortedNumbers[index]!;
    let end = start;

    while (index + 1 < sortedNumbers.length && sortedNumbers[index + 1] === end + 1) {
      index += 1;
      end = sortedNumbers[index]!;
    }

    if (start === end) {
      parts.push(`${prefix}${start}`);
    } else if (prefix.length > 0) {
      parts.push(`${prefix}${start}-${prefix}${end}`);
    } else {
      parts.push(`${start}-${end}`);
    }

    index += 1;
  }

  return parts.join(', ');
}

function getMissingDisplayCode(page: AlbumPage, stickerId: StickerIdentifier): string {
  if (page.type === 'team') {
    return page.albumCode;
  }

  if (String(stickerId).startsWith('CC')) {
    return 'CC';
  }

  return 'FWC';
}

function getMissingDisplayNumber(stickerId: StickerIdentifier): string {
  const value = String(stickerId);

  if (/^[A-Z]{3}-\d+$/.test(value)) {
    return value.split('-')[1] ?? value;
  }

  if (/^CC\d+$/.test(value)) {
    return value.slice(2);
  }

  return value;
}

function formatMissingShareEntry(page: AlbumPage, stickerId: StickerIdentifier): string {
  return `${getMissingDisplayCode(page, stickerId)} ${getMissingDisplayNumber(stickerId)}`;
}

export function buildSharePreviewPayload(
  collection: CollectionState,
  selectedPageIds: readonly PageId[]
): SharePreviewPayload {
  const selectedSet = new Set(selectedPageIds);
  const orderedSelectedPageIds = CANONICAL_PAGE_IDS.filter((pageId) => selectedSet.has(pageId));

  let totalStickerCount = 0;

  const sections = PAGE_SECTION_RUNS.map((run): SharePreviewSection => {
    const pages = run.pages
      .filter((page) => selectedSet.has(page.pageId))
      .map((page) => createPreviewPageBlock(collection, page.pageId))
      .filter((page) => page.stickerIds.length > 0);

    totalStickerCount += pages.reduce((sum, page) => sum + page.stickerIds.length, 0);

    return {
      sectionId: run.sectionId,
      sectionLabel: getSectionLabel(run.sectionId),
      pages
    };
  }).filter((section) => section.pages.length > 0);

  return {
    selectedPageIds: orderedSelectedPageIds,
    selectedPageCount: sections.reduce((sum, section) => sum + section.pages.length, 0),
    totalStickerCount,
    sections
  };
}

export function encodeShareSelection(pageIds: readonly PageId[]): string | undefined {
  const selectedSet = new Set(pageIds);
  const ids = CANONICAL_PAGE_IDS.filter((pageId) => selectedSet.has(pageId));

  if (ids.length === 0) {
    return undefined;
  }

  return ids.join(',');
}

export function decodeShareSelection(raw: string | undefined | null): readonly PageId[] {
  if (!raw) {
    return [];
  }

  const inputIds = raw
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0)
    .filter((token): token is PageId => isValidPageId(token));

  const selectedSet = new Set(inputIds);

  return CANONICAL_PAGE_IDS.filter((pageId) => selectedSet.has(pageId));
}

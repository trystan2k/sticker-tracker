import { albumPages, type AlbumPage, type PageId, type StickerIdentifier } from '@/data/album';

export const SWIPE_THRESHOLD_PX = 48;

export type ViewerFilter = 'all' | 'collected' | 'missing';

export type ViewerPageSectionRun = Readonly<{
  sectionId: string;
  pages: readonly AlbumPage[];
}>;

function assertAlbumHasPages(): void {
  if (albumPages.length === 0) {
    throw new Error('Album pages dataset cannot be empty.');
  }
}

function getSectionId(page: AlbumPage): string {
  return page.type === 'team' ? `group-${page.group}` : `special-${page.key}`;
}

export function getActivePage(pageId: PageId): AlbumPage {
  assertAlbumHasPages();

  return albumPages.find((page) => page.pageId === pageId) ?? albumPages[0]!;
}

export function isValidPageId(rawId: string): rawId is PageId {
  return albumPages.some((page) => page.pageId === rawId);
}

export function getAlbumPath(page: AlbumPage): string {
  if (page.type === 'team') {
    return `/album/${page.group}/${page.pageId}`;
  }

  return `/album/${page.pageId}`;
}

export function getAlbumPageByRoute(
  groupOrUndefined: string | undefined,
  pageId: string
): AlbumPage | undefined {
  const page = albumPages.find((candidate) => candidate.pageId === pageId);

  if (!page) {
    return undefined;
  }

  if (groupOrUndefined === undefined) {
    return page.type === 'special' ? page : undefined;
  }

  if (page.type !== 'team') {
    return undefined;
  }

  return page.group === groupOrUndefined ? page : undefined;
}

export function getNextPage(currentPageId: PageId): AlbumPage {
  assertAlbumHasPages();

  const currentIndex = albumPages.findIndex((page) => page.pageId === currentPageId);
  const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (baseIndex + 1) % albumPages.length;

  return albumPages[nextIndex]!;
}

export function getPrevPage(currentPageId: PageId): AlbumPage {
  assertAlbumHasPages();

  const currentIndex = albumPages.findIndex((page) => page.pageId === currentPageId);
  const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  const prevIndex = (baseIndex - 1 + albumPages.length) % albumPages.length;

  return albumPages[prevIndex]!;
}

function getPageIndex(pageId: PageId): number {
  return albumPages.findIndex((page) => page.pageId === pageId);
}

export function getNavigationDirection(
  currentPageId: PageId,
  targetPageId: PageId
): 'forward' | 'back' {
  const currentIndex = getPageIndex(currentPageId);
  const targetIndex = getPageIndex(targetPageId);

  if (currentIndex === -1 || targetIndex === -1) {
    return 'forward';
  }

  return targetIndex > currentIndex ? 'forward' : 'back';
}

export function derivePageSectionRuns(): readonly ViewerPageSectionRun[] {
  assertAlbumHasPages();

  const runs: ViewerPageSectionRun[] = [];

  for (const page of albumPages) {
    const sectionId = getSectionId(page);
    const previousRun = runs.at(-1);

    if (!previousRun || previousRun.sectionId !== sectionId) {
      runs.push({ sectionId, pages: [page] });
      continue;
    }

    runs[runs.length - 1] = {
      sectionId,
      pages: [...previousRun.pages, page]
    };
  }

  return runs;
}

export const PAGE_SECTION_RUNS = derivePageSectionRuns();

export function applyStickerFilter(
  stickerIds: readonly StickerIdentifier[],
  collectedStickerIds: ReadonlySet<StickerIdentifier>,
  filter: ViewerFilter
): readonly StickerIdentifier[] {
  if (filter === 'all') {
    return stickerIds;
  }

  if (filter === 'collected') {
    return stickerIds.filter((stickerId) => collectedStickerIds.has(stickerId));
  }

  return stickerIds.filter((stickerId) => !collectedStickerIds.has(stickerId));
}

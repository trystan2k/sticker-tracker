import type { PageId, StickerIdentifier } from '@/data/album';
import type { CollectionState } from '@/services/collection-service';

export function createPageId(value: string): PageId {
  return value as PageId;
}

function createStickerIdentifier(value: string): StickerIdentifier {
  return value as StickerIdentifier;
}

export function createCollectionState(entries: Record<string, string[]>): CollectionState {
  const result: Partial<Record<PageId, ReadonlySet<StickerIdentifier>>> = {};

  for (const [pageId, stickerIds] of Object.entries(entries)) {
    result[createPageId(pageId)] = new Set(stickerIds.map(createStickerIdentifier));
  }

  return result as CollectionState;
}

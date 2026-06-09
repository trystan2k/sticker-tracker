import type { PageId, StickerIdentifier } from '@/data/album';
import type { CollectionState } from '@/services/collection-service';

export function createPageId(value: string): PageId {
  return value as PageId;
}

function createStickerIdentifier(value: string): StickerIdentifier {
  return value as StickerIdentifier;
}

export function createCollectionState(
  entries: Record<string, string[] | Record<string, number>>
): CollectionState {
  const result: Partial<Record<PageId, Readonly<Record<StickerIdentifier, number>>>> = {};

  for (const [pageId, stickerState] of Object.entries(entries)) {
    result[createPageId(pageId)] = Array.isArray(stickerState)
      ? Object.fromEntries(stickerState.map((stickerId) => [createStickerIdentifier(stickerId), 1]))
      : Object.fromEntries(
          Object.entries(stickerState).map(([stickerId, quantity]) => [
            createStickerIdentifier(stickerId),
            quantity
          ])
        );
  }

  return result as CollectionState;
}

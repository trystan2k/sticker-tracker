import type { StickerIdentifier } from '@/data/album';
import { read, type StorageState, write } from '@/lib/storage/app-storage';
import {
  getStickerQuantity,
  hydrateCollectionState,
  serializeCollectionState,
  type CollectionState
} from '@/services/collection-service';

export type MarkStickersAsHaveResult =
  | {
      state: 'ready';
      value: CollectionState;
      updatedStickerIds: StickerIdentifier[];
    }
  | {
      state: Exclude<StorageState, 'ready'>;
    };

function dedupeStickerIds(stickerIds: readonly string[]): StickerIdentifier[] {
  const unique = [...new Set(stickerIds)];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return unique.map((id) => id as StickerIdentifier);
}

export async function markStickersAsHaveInCollection(
  currentCollection: CollectionState,
  stickerIds: readonly string[]
): Promise<MarkStickersAsHaveResult> {
  const uniqueStickerIds = dedupeStickerIds(stickerIds);

  if (uniqueStickerIds.length === 0) {
    return {
      state: 'ready',
      value: currentCollection,
      updatedStickerIds: []
    };
  }

  const scannerLookupResult = await read('scannerLookup');

  if (scannerLookupResult.state !== 'ready') {
    return { state: scannerLookupResult.state };
  }

  if (scannerLookupResult.value === null) {
    return { state: 'unavailable' };
  }

  const scannerLookup = scannerLookupResult.value;
  const nextCollection: Record<string, Record<StickerIdentifier, number>> = {
    ...currentCollection
  };
  const updatedStickerIds: StickerIdentifier[] = [];

  for (const stickerId of uniqueStickerIds) {
    const lookupMatch = scannerLookup.entries[stickerId];

    if (!lookupMatch) {
      continue;
    }

    if (getStickerQuantity(nextCollection, lookupMatch.pageId, lookupMatch.stickerId) > 0) {
      continue;
    }

    nextCollection[lookupMatch.pageId] = {
      ...nextCollection[lookupMatch.pageId],
      [lookupMatch.stickerId]: 1
    };
    updatedStickerIds.push(lookupMatch.stickerId);
  }

  const writeResult = await write(
    'collection',
    serializeCollectionState(nextCollection as CollectionState)
  );

  if (writeResult.state !== 'ready') {
    return { state: writeResult.state };
  }

  return {
    state: 'ready',
    value: nextCollection,
    updatedStickerIds
  };
}

export async function markStickersAsHave(stickerIds: string[]): Promise<MarkStickersAsHaveResult> {
  const collectionResult = await read('collection');

  if (collectionResult.state !== 'ready') {
    return { state: collectionResult.state };
  }

  return markStickersAsHaveInCollection(
    hydrateCollectionState(collectionResult.value ?? null),
    stickerIds
  );
}

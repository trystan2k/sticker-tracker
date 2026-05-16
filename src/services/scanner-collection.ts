import { openDB as openDatabase } from 'idb';

import type { StickerIdentifier } from '@/data/album';
import {
  APP_STORAGE_DATABASE_VERSION,
  APP_STORAGE_STORE_NAME,
  getDatabaseNameForStorage,
  type PersistedCollection,
  type PersistedScannerLookup,
  type StorageState
} from '@/lib/storage/app-storage';
import {
  hydrateCollectionState,
  loadCollectionState,
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

function isScannerLookupEntry(
  entry: unknown
): entry is { key: 'scannerLookup'; value: PersistedScannerLookup } {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'key' in entry &&
    entry.key === 'scannerLookup' &&
    'value' in entry
  );
}

function isCollectionEntry(
  entry: unknown
): entry is { key: 'collection'; value: PersistedCollection } {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'key' in entry &&
    entry.key === 'collection' &&
    'value' in entry
  );
}

function dedupeStickerIds(stickerIds: readonly string[]): StickerIdentifier[] {
  const unique = [...new Set(stickerIds)];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return unique.map((id) => id as StickerIdentifier);
}

export async function markStickersAsHave(stickerIds: string[]): Promise<MarkStickersAsHaveResult> {
  const uniqueStickerIds = dedupeStickerIds(stickerIds);

  if (uniqueStickerIds.length === 0) {
    const collectionResult = await loadCollectionState();

    if (collectionResult.state !== 'ready') {
      return { state: collectionResult.state };
    }

    return {
      state: 'ready',
      value: collectionResult.value,
      updatedStickerIds: []
    };
  }

  try {
    const db = await openDatabase(getDatabaseNameForStorage(), APP_STORAGE_DATABASE_VERSION);
    try {
      const transaction = db.transaction(APP_STORAGE_STORE_NAME, 'readwrite');

      const scannerLookupRaw = await transaction.store.get('scannerLookup');

      if (!isScannerLookupEntry(scannerLookupRaw)) {
        return { state: 'unavailable' };
      }

      const scannerLookupEntry = scannerLookupRaw;

      const collectionRaw = await transaction.store.get('collection');
      const collectionEntry = isCollectionEntry(collectionRaw) ? collectionRaw : undefined;

      const currentCollection = hydrateCollectionState(collectionEntry?.value ?? null);
      const nextCollection: Record<string, ReadonlySet<StickerIdentifier>> = {
        ...currentCollection
      };

      const updatedStickerIds: StickerIdentifier[] = [];

      for (const stickerId of uniqueStickerIds) {
        const lookupMatch = scannerLookupEntry.value.entries[stickerId];

        if (!lookupMatch) {
          continue;
        }

        const currentPageState = new Set(nextCollection[lookupMatch.pageId] ?? []);

        if (currentPageState.has(lookupMatch.stickerId)) {
          continue;
        }

        currentPageState.add(lookupMatch.stickerId);
        nextCollection[lookupMatch.pageId] = currentPageState;
        updatedStickerIds.push(lookupMatch.stickerId);
      }

      await transaction.store.put({
        key: 'collection',
        value: serializeCollectionState(nextCollection as CollectionState)
      });
      await transaction.done;

      const refreshedCollectionResult = await loadCollectionState();

      if (refreshedCollectionResult.state !== 'ready') {
        return { state: refreshedCollectionResult.state };
      }

      return {
        state: 'ready',
        value: refreshedCollectionResult.value,
        updatedStickerIds
      };
    } finally {
      db.close();
    }
  } catch {
    return { state: 'unavailable' };
  }
}

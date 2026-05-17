import type { PageId, StickerIdentifier } from '@/data/album';
import {
  read,
  type PersistedCollection,
  type StorageState,
  write
} from '@/lib/storage/app-storage';

export type CollectionState = Readonly<Record<PageId, ReadonlySet<StickerIdentifier>>>;

export type CollectionLoadResult =
  | {
      state: 'ready';
      value: CollectionState;
    }
  | {
      state: Exclude<StorageState, 'ready'>;
    };

export type ToggleStickerResult =
  | {
      state: 'ready';
      value: CollectionState;
    }
  | {
      state: Exclude<StorageState, 'ready'>;
    };

export type ReplaceCollectionResult =
  | {
      state: 'ready';
      value: CollectionState;
    }
  | {
      state: Exclude<StorageState, 'ready'>;
    };

function createEmptyCollectionState(): CollectionState {
  return {};
}

export function hydrateCollectionState(
  persistedCollection: PersistedCollection | null
): CollectionState {
  if (persistedCollection === null) {
    return createEmptyCollectionState();
  }

  const hydratedEntries = Object.entries(persistedCollection).map(([pageId, stickerIds]) => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return [pageId as PageId, new Set(stickerIds)] as const;
  });

  return Object.fromEntries(hydratedEntries) as CollectionState;
}

export function serializeCollectionState(state: CollectionState): PersistedCollection {
  const serializedEntries = Object.entries(state).map(([pageId, stickerIds]) => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return [pageId as PageId, [...stickerIds]] as const;
  });

  return Object.fromEntries(serializedEntries) as PersistedCollection;
}

export async function loadCollectionState(): Promise<CollectionLoadResult> {
  const readResult = await read('collection');

  if (readResult.state === 'ready') {
    return {
      state: 'ready',
      value: hydrateCollectionState(readResult.value)
    };
  }

  return { state: readResult.state };
}

export async function toggleStickerCollectionState(
  currentState: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier
): Promise<ToggleStickerResult> {
  const nextState: Record<PageId, ReadonlySet<StickerIdentifier>> = { ...currentState };
  const currentPageState = new Set(currentState[pageId] ?? []);

  if (currentPageState.has(stickerId)) {
    currentPageState.delete(stickerId);
  } else {
    currentPageState.add(stickerId);
  }

  if (currentPageState.size === 0) {
    delete nextState[pageId];
  } else {
    nextState[pageId] = currentPageState;
  }

  const writeResult = await write('collection', serializeCollectionState(nextState));

  if (writeResult.state !== 'ready') {
    return { state: writeResult.state };
  }

  return {
    state: 'ready',
    value: nextState
  };
}

export async function replacePersistedCollection(
  persistedCollection: PersistedCollection
): Promise<ReplaceCollectionResult> {
  const writeResult = await write('collection', persistedCollection);

  if (writeResult.state !== 'ready') {
    return { state: writeResult.state };
  }

  return {
    state: 'ready',
    value: hydrateCollectionState(persistedCollection)
  };
}

import { albumPages, type PageId, type StickerIdentifier } from '@/data/album';
import {
  type PersistedCollectionPage,
  read,
  type PersistedCollection,
  type StorageState,
  write
} from '@/lib/storage/app-storage';

export type CollectionState = Readonly<Record<PageId, Readonly<Record<StickerIdentifier, number>>>>;

const PAGE_BY_ID = new Map(albumPages.map((page) => [page.pageId, page]));
const STICKER_IDS_BY_PAGE = new Map(
  albumPages.map((page) => [page.pageId, new Set(page.stickerIds as readonly string[])] as const)
);

function findKnownStickerId(pageId: PageId, rawStickerId: string): StickerIdentifier | null {
  return PAGE_BY_ID.get(pageId)?.stickerIds.find((stickerId) => stickerId === rawStickerId) ?? null;
}

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

export type UpdateStickerQuantityResult =
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStickerQuantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    return 0;
  }

  return value;
}

function hasNormalizedPersistedShape(
  persistedCollection: PersistedCollection | null,
  normalizedCollection: CollectionState
): boolean {
  if (persistedCollection === null) {
    return true;
  }

  return (
    JSON.stringify(persistedCollection) ===
    JSON.stringify(serializeCollectionState(normalizedCollection))
  );
}

function hydrateLegacyPageState(
  pageId: PageId,
  stickerIds: readonly StickerIdentifier[]
): ReadonlyArray<readonly [StickerIdentifier, number]> {
  const validStickerIds = STICKER_IDS_BY_PAGE.get(pageId);

  if (!validStickerIds) {
    return [];
  }

  const stickerIdCounts = stickerIds.reduce(
    (counts, stickerId) => counts.set(stickerId, (counts.get(stickerId) ?? 0) + 1),
    new Map<string, number>()
  );

  return [...stickerIdCounts.entries()].flatMap(([stickerId, count]) => {
    if (count !== 1) {
      return [];
    }

    if (!validStickerIds.has(stickerId)) {
      return [];
    }

    const knownStickerId = findKnownStickerId(pageId, stickerId);

    return knownStickerId ? [[knownStickerId, 1] as const] : [];
  });
}

function hydrateQuantityPageState(
  pageId: PageId,
  quantities: Record<string, unknown>
): ReadonlyArray<readonly [StickerIdentifier, number]> {
  const validStickerIds = STICKER_IDS_BY_PAGE.get(pageId);

  if (!validStickerIds) {
    return [];
  }

  return Object.entries(quantities).flatMap(([stickerId, quantity]) => {
    if (!validStickerIds.has(stickerId)) {
      return [];
    }

    const knownStickerId = findKnownStickerId(pageId, stickerId);
    const normalizedQuantity = normalizeStickerQuantity(quantity);

    return knownStickerId && normalizedQuantity > 0
      ? [[knownStickerId, normalizedQuantity] as const]
      : [];
  });
}

function setStickerQuantity(
  currentState: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier,
  quantity: number
): CollectionState {
  const currentPageState = currentState[pageId] ?? {};
  const nextPageState = { ...currentPageState } as Record<StickerIdentifier, number>;

  if (quantity <= 0) {
    delete nextPageState[stickerId];
  } else {
    nextPageState[stickerId] = quantity;
  }

  if (Object.keys(nextPageState).length === 0) {
    const nextStateWithoutPage = { ...currentState } as Record<
      PageId,
      Readonly<Record<StickerIdentifier, number>>
    >;
    delete nextStateWithoutPage[pageId];
    return nextStateWithoutPage;
  }

  return {
    ...currentState,
    [pageId]: nextPageState
  };
}

export function hydrateCollectionState(
  persistedCollection: PersistedCollection | null
): CollectionState {
  if (persistedCollection === null) {
    return createEmptyCollectionState();
  }

  if (!isObjectRecord(persistedCollection)) {
    return createEmptyCollectionState();
  }

  const hydratedEntries = Object.entries(persistedCollection).flatMap(([pageId, rawPageState]) => {
    const page = albumPages.find((candidate) => candidate.pageId === pageId);

    if (!page) {
      return [];
    }

    const normalizedEntries = Array.isArray(rawPageState)
      ? hydrateLegacyPageState(page.pageId, rawPageState)
      : isObjectRecord(rawPageState)
        ? hydrateQuantityPageState(page.pageId, rawPageState)
        : [];

    if (normalizedEntries.length === 0) {
      return [];
    }

    return [[page.pageId, Object.fromEntries(normalizedEntries)] as const];
  });

  return Object.fromEntries(hydratedEntries);
}

function normalizePersistedCollection(persistedCollection: PersistedCollection | null): Readonly<{
  collection: CollectionState;
  needsWriteBack: boolean;
}> {
  const collection = hydrateCollectionState(persistedCollection);

  if (persistedCollection === null) {
    return {
      collection,
      needsWriteBack: false
    };
  }

  return {
    collection,
    needsWriteBack: !hasNormalizedPersistedShape(persistedCollection, collection)
  };
}

export function serializeCollectionState(state: CollectionState): PersistedCollection {
  const serializedState: Record<PageId, PersistedCollectionPage> = {};

  for (const page of albumPages) {
    const quantities = state[page.pageId];

    if (!quantities || Object.keys(quantities).length === 0) {
      continue;
    }

    serializedState[page.pageId] = { ...quantities };
  }

  return serializedState;
}

export function getStickerQuantity(
  collection: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier
): number {
  return normalizeStickerQuantity(collection[pageId]?.[stickerId]);
}

export function getStickerRepeatedCount(
  collection: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier
): number {
  return Math.max(0, getStickerQuantity(collection, pageId, stickerId) - 1);
}

export function derivePageCollectedStickerIds(
  collection: CollectionState,
  pageId: PageId
): ReadonlySet<StickerIdentifier> {
  const collectedStickerIds = new Set<StickerIdentifier>();

  for (const [stickerId, quantity] of Object.entries(collection[pageId] ?? {})) {
    const knownStickerId = findKnownStickerId(pageId, stickerId);

    if (!knownStickerId || normalizeStickerQuantity(quantity) <= 0) {
      continue;
    }

    collectedStickerIds.add(knownStickerId);
  }

  return collectedStickerIds;
}

export function countUniqueCollectedStickers(collection: CollectionState): number {
  return Object.values(collection).reduce((total, pageState) => {
    return total + Object.keys(pageState).length;
  }, 0);
}

export function countRepeatedCopies(collection: CollectionState): number {
  return Object.values(collection).reduce((total, pageState) => {
    return (
      total +
      Object.values(pageState).reduce(
        (pageTotal, quantity) => pageTotal + Math.max(0, normalizeStickerQuantity(quantity) - 1),
        0
      )
    );
  }, 0);
}

export async function loadCollectionState(): Promise<CollectionLoadResult> {
  const readResult = await read('collection');

  if (readResult.state === 'ready') {
    const normalized = normalizePersistedCollection(readResult.value);

    if (normalized.needsWriteBack) {
      await write('collection', serializeCollectionState(normalized.collection));
    }

    return {
      state: 'ready',
      value: normalized.collection
    };
  }

  return { state: readResult.state };
}

export async function updateStickerQuantity(
  currentState: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier,
  quantity: number
): Promise<UpdateStickerQuantityResult> {
  const normalizedQuantity = normalizeStickerQuantity(quantity);
  const nextState = setStickerQuantity(currentState, pageId, stickerId, normalizedQuantity);

  const writeResult = await write('collection', serializeCollectionState(nextState));

  if (writeResult.state !== 'ready') {
    return { state: writeResult.state };
  }

  return {
    state: 'ready',
    value: nextState
  };
}

export async function toggleStickerCollectionState(
  currentState: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier
): Promise<ToggleStickerResult> {
  const currentQuantity = getStickerQuantity(currentState, pageId, stickerId);
  const nextQuantity = currentQuantity > 0 ? 0 : 1;

  return updateStickerQuantity(currentState, pageId, stickerId, nextQuantity);
}

export async function replacePersistedCollection(
  persistedCollection: PersistedCollection
): Promise<ReplaceCollectionResult> {
  const normalizedCollection = hydrateCollectionState(persistedCollection);
  const writeResult = await write('collection', serializeCollectionState(normalizedCollection));

  if (writeResult.state !== 'ready') {
    return { state: writeResult.state };
  }

  return {
    state: 'ready',
    value: normalizedCollection
  };
}

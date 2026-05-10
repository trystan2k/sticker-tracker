import {
  deleteDB as deleteDatabase,
  openDB as openDatabase,
  type DBSchema,
  type IDBPDatabase,
  type OpenDBCallbacks
} from 'idb';

import type { PageId, StickerIdentifier } from '@/data/album';

const DATABASE_NAME = 'sticker-tracker-app-storage';
const DATABASE_VERSION = 1;
const STORE_NAME = 'app-storage';
const UNRECOVERABLE_FAILURE_THRESHOLD = 2;

type AppStorageKey = 'collection' | 'locale';

type OpenDatabaseFunction = (
  name: string,
  version?: number,
  callbacks?: OpenDBCallbacks<AppStorageDatabaseSchema>
) => Promise<IDBPDatabase<AppStorageDatabaseSchema>>;

type DeleteDatabaseFunction = (name: string) => Promise<void>;

type StorageDriver = {
  openDatabase: OpenDatabaseFunction;
  deleteDatabase: DeleteDatabaseFunction;
};

export type PersistedCollection = Readonly<Record<PageId, readonly StickerIdentifier[]>>;

type AppStorageValueByKey = {
  collection: PersistedCollection;
  locale: string;
};

type AppStorageEntry = {
  [Key in AppStorageKey]: {
    key: Key;
    value: AppStorageValueByKey[Key];
  };
}[AppStorageKey];

interface AppStorageDatabaseSchema extends DBSchema {
  [STORE_NAME]: {
    key: AppStorageKey;
    value: AppStorageEntry;
  };
}

export type StorageState = 'ready' | 'unavailable' | 'unrecoverable';

type StorageStatusResult = Readonly<{
  state: StorageState;
}>;

export type InitializeStorageResult = StorageStatusResult;

export type StorageReadResult<Key extends AppStorageKey> =
  | {
      state: 'ready';
      value: AppStorageValueByKey[Key] | null;
    }
  | {
      state: 'unavailable' | 'unrecoverable';
    };

export type StorageWriteResult = StorageStatusResult;
export type ResetAllDataResult = StorageStatusResult;

let database: IDBPDatabase<AppStorageDatabaseSchema> | null = null;
let openFailureCount = 0;
let readFailureCount = 0;

const defaultStorageDriver: StorageDriver = {
  openDatabase,
  deleteDatabase
};

let storageDriver: StorageDriver = defaultStorageDriver;

function hasIndexedDbSupport(): boolean {
  return typeof globalThis.indexedDB !== 'undefined';
}

function classifyOpenFailureState(): Exclude<StorageState, 'ready'> {
  openFailureCount += 1;

  if (openFailureCount >= UNRECOVERABLE_FAILURE_THRESHOLD) {
    return 'unrecoverable';
  }

  return 'unavailable';
}

function classifyReadFailureState(): Exclude<StorageState, 'ready'> {
  readFailureCount += 1;

  if (readFailureCount >= UNRECOVERABLE_FAILURE_THRESHOLD) {
    return 'unrecoverable';
  }

  return 'unavailable';
}

async function getDatabase(): Promise<IDBPDatabase<AppStorageDatabaseSchema> | null> {
  if (!hasIndexedDbSupport()) {
    return null;
  }

  if (database !== null) {
    return database;
  }

  database = await storageDriver.openDatabase(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(upgradingDatabase) {
      if (!upgradingDatabase.objectStoreNames.contains(STORE_NAME)) {
        upgradingDatabase.createObjectStore(STORE_NAME, {
          keyPath: 'key'
        });
      }
    }
  });

  return database;
}

function readyResult(): StorageStatusResult {
  return { state: 'ready' };
}

function unavailableResult(): StorageStatusResult {
  return { state: 'unavailable' };
}

function unrecoverableResult(): StorageStatusResult {
  return { state: 'unrecoverable' };
}

function stateToResult(state: Exclude<StorageState, 'ready'>): StorageStatusResult {
  if (state === 'unrecoverable') {
    return unrecoverableResult();
  }

  return unavailableResult();
}

export function setStorageDriverForTests(driver: StorageDriver | null): void {
  storageDriver = driver ?? defaultStorageDriver;
  database = null;
  openFailureCount = 0;
  readFailureCount = 0;
}

export function resetStorageStateForTests(): void {
  if (database !== null) {
    database.close();
  }

  database = null;
  openFailureCount = 0;
  readFailureCount = 0;
}

export async function initializeStorage(): Promise<InitializeStorageResult> {
  if (!hasIndexedDbSupport()) {
    return unavailableResult();
  }

  try {
    await getDatabase();
    openFailureCount = 0;

    return readyResult();
  } catch {
    database = null;

    return stateToResult(classifyOpenFailureState());
  }
}

export async function read<Key extends AppStorageKey>(key: Key): Promise<StorageReadResult<Key>> {
  try {
    const db = await getDatabase();

    if (db === null) {
      return {
        state: 'unavailable'
      };
    }

    const entry = await db.get(STORE_NAME, key);
    readFailureCount = 0;

    if (!entry) {
      return {
        state: 'ready',
        value: null
      };
    }

    return {
      state: 'ready',
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      value: entry.value as AppStorageValueByKey[Key]
    };
  } catch {
    return {
      state: classifyReadFailureState()
    };
  }
}

export async function write<Key extends AppStorageKey>(
  key: Key,
  value: AppStorageValueByKey[Key]
): Promise<StorageWriteResult> {
  try {
    const db = await getDatabase();

    if (db === null) {
      return unavailableResult();
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    await db.put(STORE_NAME, {
      key,
      value
    } as AppStorageEntry);

    return readyResult();
  } catch {
    database = null;

    return stateToResult(classifyReadFailureState());
  }
}

export async function resetAllData(): Promise<ResetAllDataResult> {
  if (!hasIndexedDbSupport()) {
    return unavailableResult();
  }

  try {
    if (database !== null) {
      database.close();
      database = null;
    }

    await storageDriver.deleteDatabase(DATABASE_NAME);

    openFailureCount = 0;
    readFailureCount = 0;

    return readyResult();
  } catch {
    return unrecoverableResult();
  }
}

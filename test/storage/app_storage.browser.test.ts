import { describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import {
  initializeStorage,
  read,
  resetAllData,
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests,
  write
} from '@/lib/storage/app_storage';

describe('app_storage browser adapter', () => {
  describe('real indexeddb flow', () => {
    it('opens database and supports write/read flow', async () => {
      setStorageDriverForTests(null);
      setDatabaseNameForTests('test-write-read');
      resetStorageStateForTests();

      const initResult = await initializeStorage();
      expect(initResult).toEqual({ state: 'ready' });

      const collection: Record<PageId, readonly StickerIdentifier[]> = {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        mex: ['MEX-1', 'MEX-2'].map((item) => item as StickerIdentifier)
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      } as Record<PageId, readonly StickerIdentifier[]>;

      const writeResult = await write('collection', collection);
      expect(writeResult).toEqual({ state: 'ready' });

      const collectionReadResult = await read('collection');
      expect(collectionReadResult).toEqual({ state: 'ready', value: collection });

      const localeWriteResult = await write('locale', 'pt-BR');
      expect(localeWriteResult).toEqual({ state: 'ready' });

      const localeReadResult = await read('locale');
      expect(localeReadResult).toEqual({ state: 'ready', value: 'pt-BR' });
    });

    it('returns empty first-run reads as null', async () => {
      setStorageDriverForTests(null);
      setDatabaseNameForTests('test-empty-reads');
      resetStorageStateForTests();

      await initializeStorage();

      const collectionReadResult = await read('collection');
      const localeReadResult = await read('locale');

      expect(collectionReadResult).toEqual({ state: 'ready', value: null });
      expect(localeReadResult).toEqual({ state: 'ready', value: null });
    });

    it('resets all data and clears persisted records', async () => {
      setStorageDriverForTests(null);
      setDatabaseNameForTests('test-reset-data');
      resetStorageStateForTests();

      await initializeStorage();
      await write('locale', 'es');

      const resetResult = await resetAllData();
      expect(resetResult).toEqual({ state: 'ready' });

      const nextInitResult = await initializeStorage();
      expect(nextInitResult).toEqual({ state: 'ready' });

      const localeReadResult = await read('locale');
      expect(localeReadResult).toEqual({ state: 'ready', value: null });
    });
  });

  describe('failure classification', () => {
    it('classifies repeated initialization failures as unrecoverable', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {},
        openDatabase: async () => {
          throw new Error('open failed');
        }
      });

      const firstInitResult = await initializeStorage();
      expect(firstInitResult).toEqual({ state: 'unavailable' });

      const secondInitResult = await initializeStorage();
      expect(secondInitResult).toEqual({ state: 'unrecoverable' });
    });

    it('classifies repeated read transaction failures as unrecoverable', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {},
        openDatabase: async () =>
          ({
            close: vi.fn<() => void>(),
            get: async () => {
              throw new Error('read failed');
            },
            put: async () => {}
          }) as never
      });

      const firstReadResult = await read('locale');
      expect(firstReadResult).toEqual({ state: 'unavailable' });

      const secondReadResult = await read('locale');
      expect(secondReadResult).toEqual({ state: 'unrecoverable' });
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import { markStickersAsHave } from '@/services/scanner-collection';

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerIdentifier(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

const { mockStore, mockIdb, loadCollectionStateMock } = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const transactionDone = Promise.resolve();
  const loadMock = vi.fn<() => Promise<{ state: string; value?: object }>>();

  return {
    mockStore: store,
    mockIdb: {
      openDB: vi.fn<
        () => Promise<{
          transaction: () => {
            store: {
              get: (key: string) => Promise<unknown>;
              put: (entry: { key: string; value: unknown }) => Promise<void>;
            };
            done: Promise<void>;
            abort: () => void;
          };
          close: () => void;
        }>
      >(async () => ({
        transaction: vi.fn<
          () => {
            store: {
              get: (key: string) => Promise<unknown>;
              put: (entry: { key: string; value: unknown }) => Promise<void>;
            };
            done: Promise<void>;
            abort: () => void;
          }
        >(() => ({
          store: {
            get: vi.fn<(key: string) => Promise<unknown>>(async (key: string) => store.get(key)),
            put: vi.fn<(entry: { key: string; value: unknown }) => Promise<void>>(
              async (entry: { key: string; value: unknown }) => {
                store.set(entry.key, entry);
              }
            )
          },
          done: transactionDone,
          abort: vi.fn<() => void>(() => {
            throw new Error('Transaction aborted');
          })
        })),
        close: vi.fn<() => void>()
      })),
      deleteDB: vi.fn<() => void>()
    },
    loadCollectionStateMock: loadMock
  };
});

vi.mock('idb', () => mockIdb);

vi.mock('@/lib/storage/app-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage/app-storage')>();
  return {
    ...actual,
    getDatabaseNameForStorage: () => 'test-db'
  };
});

vi.mock('@/services/collection-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/collection-service')>();
  return {
    ...actual,
    loadCollectionState: loadCollectionStateMock
  };
});

describe('scanner-collection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockStore.clear();
    loadCollectionStateMock.mockResolvedValue({ state: 'ready', value: {} });

    const lookupIndex = {
      version: 1,
      entries: {
        'BRA-1': {
          stickerId: asStickerIdentifier('BRA-1'),
          pageId: asPageId('bra'),
          pageType: 'team' as const,
          translationKey: 'team.bra',
          albumCode: 'BRA',
          group: 'C',
          flagCode: 'br'
        },
        'MEX-1': {
          stickerId: asStickerIdentifier('MEX-1'),
          pageId: asPageId('mex'),
          pageType: 'team' as const,
          translationKey: 'team.mex',
          albumCode: 'MEX',
          group: 'A',
          flagCode: 'mx'
        },
        '00': {
          stickerId: asStickerIdentifier('00'),
          pageId: asPageId('fwc-opening'),
          pageType: 'special' as const,
          translationKey: 'special.fwc-opening',
          albumCode: null,
          group: null,
          flagCode: null
        },
        CC1: {
          stickerId: asStickerIdentifier('CC1'),
          pageId: asPageId('coca-cola'),
          pageType: 'special' as const,
          translationKey: 'special.coca-cola',
          albumCode: null,
          group: null,
          flagCode: null
        }
      }
    };

    mockStore.set('scannerLookup', {
      key: 'scannerLookup',
      value: lookupIndex
    });

    mockStore.set('collection', {
      key: 'collection',
      value: {}
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('markStickersAsHave', () => {
    it('returns empty updated list for empty input', async () => {
      const result = await markStickersAsHave([]);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toEqual([]);
      }
    });

    it('marks new sticker as collected', async () => {
      const result = await markStickersAsHave(['BRA-1']);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toEqual([asStickerIdentifier('BRA-1')]);
      }
    });

    it('skips already-collected sticker (idempotent)', async () => {
      mockStore.set('collection', {
        key: 'collection',
        value: {
          bra: [asStickerIdentifier('BRA-1')]
        }
      });

      const result = await markStickersAsHave(['BRA-1']);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toEqual([]);
      }
    });

    it('marks multiple stickers in batch', async () => {
      const result = await markStickersAsHave(['BRA-1', 'MEX-1']);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toHaveLength(2);
        expect(result.updatedStickerIds).toContainEqual(asStickerIdentifier('BRA-1'));
        expect(result.updatedStickerIds).toContainEqual(asStickerIdentifier('MEX-1'));
      }
    });

    it('deduplicates sticker ids', async () => {
      const result = await markStickersAsHave(['BRA-1', 'BRA-1', 'BRA-1']);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toEqual([asStickerIdentifier('BRA-1')]);
      }
    });

    it('skips unknown sticker codes', async () => {
      const result = await markStickersAsHave(['BRA-1', 'XXX-999']);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toEqual([asStickerIdentifier('BRA-1')]);
      }
    });

    it('returns unavailable when scanner lookup missing', async () => {
      mockStore.delete('scannerLookup');

      const result = await markStickersAsHave(['BRA-1']);
      expect(result.state).toBe('unavailable');
    });

    it('handles special stickers (00, CC1)', async () => {
      const result = await markStickersAsHave(['00', 'CC1']);
      expect(result.state).toBe('ready');
      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toContainEqual(asStickerIdentifier('00'));
        expect(result.updatedStickerIds).toContainEqual(asStickerIdentifier('CC1'));
      }
    });

    it('returns unavailable when collection load fails with empty input', async () => {
      loadCollectionStateMock.mockResolvedValueOnce({ state: 'unavailable' });

      const result = await markStickersAsHave([]);
      expect(result.state).toBe('unavailable');
    });

    it('returns unavailable when refreshed collection load fails after write', async () => {
      loadCollectionStateMock.mockResolvedValue({ state: 'unavailable' });

      const result = await markStickersAsHave(['BRA-1']);
      expect(result.state).toBe('unavailable');
    });
  });
});

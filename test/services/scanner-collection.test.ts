import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import { markStickersAsHave, markStickersAsHaveInCollection } from '@/services/scanner-collection';

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerIdentifier(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

const { mockStore, readMock, writeMock } = vi.hoisted(() => {
  const store = new Map<string, unknown>();

  return {
    mockStore: store,
    readMock: vi.fn<
      (key: string) => Promise<{ state: 'ready'; value: unknown } | { state: 'unavailable' }>
    >(async (key: string) => ({
      state: 'ready' as const,
      value: store.get(key) ?? null
    })),
    writeMock: vi.fn<
      (key: string, value: unknown) => Promise<{ state: 'ready' } | { state: 'unavailable' }>
    >(async (key: string, value: unknown) => {
      store.set(key, value);

      return { state: 'ready' as const };
    })
  };
});

vi.mock('@/lib/storage/app-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage/app-storage')>();

  return {
    ...actual,
    read: readMock,
    write: writeMock
  };
});

describe('scanner-collection', () => {
  beforeEach(() => {
    mockStore.clear();
    readMock.mockClear();
    writeMock.mockClear();

    mockStore.set('scannerLookup', {
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
    });

    mockStore.set('collection', {});
  });

  afterEach(() => {
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
        expect(result.value).toEqual({
          [asPageId('bra')]: {
            [asStickerIdentifier('BRA-1')]: 1
          }
        });
      }
    });

    it('skips already-collected sticker (idempotent)', async () => {
      mockStore.set('collection', {
        bra: {
          [asStickerIdentifier('BRA-1')]: 2
        }
      });

      const result = await markStickersAsHave(['BRA-1']);
      expect(result.state).toBe('ready');

      if (result.state === 'ready') {
        expect(result.updatedStickerIds).toEqual([]);
      }
    });

    it('does not increment quantity for already-owned sticker', async () => {
      mockStore.set('collection', {
        bra: {
          [asStickerIdentifier('BRA-1')]: 3
        }
      });

      await markStickersAsHave(['BRA-1']);

      expect(mockStore.get('collection')).toEqual({
        bra: {
          [asStickerIdentifier('BRA-1')]: 3
        }
      });
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

    it('returns unavailable when collection read fails', async () => {
      readMock.mockImplementationOnce(async () => ({ state: 'unavailable' as const }));

      const result = await markStickersAsHave([]);
      expect(result.state).toBe('unavailable');
    });

    it('returns unavailable when collection write fails', async () => {
      writeMock.mockImplementationOnce(async () => ({ state: 'unavailable' as const }));

      const result = await markStickersAsHave(['BRA-1']);
      expect(result.state).toBe('unavailable');
    });
  });

  describe('markStickersAsHaveInCollection', () => {
    it('writes scanner changes on top of provided collection state', async () => {
      const result = await markStickersAsHaveInCollection(
        {
          [asPageId('mex')]: {
            [asStickerIdentifier('MEX-1')]: 2
          }
        },
        ['BRA-1']
      );

      expect(result).toEqual({
        state: 'ready',
        value: {
          [asPageId('mex')]: {
            [asStickerIdentifier('MEX-1')]: 2
          },
          [asPageId('bra')]: {
            [asStickerIdentifier('BRA-1')]: 1
          }
        },
        updatedStickerIds: [asStickerIdentifier('BRA-1')]
      });
    });
  });
});

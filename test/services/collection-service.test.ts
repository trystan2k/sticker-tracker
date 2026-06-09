import { describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import {
  countRepeatedCopies,
  countUniqueCollectedStickers,
  derivePageCollectedStickerIds,
  getStickerQuantity,
  hydrateCollectionState,
  loadCollectionState,
  serializeCollectionState,
  toggleStickerCollectionState,
  updateStickerQuantity
} from '@/services/collection-service';

const { readMock, writeMock } = vi.hoisted(() => ({
  readMock: vi.fn<() => Promise<unknown>>(),
  writeMock: vi.fn<() => Promise<unknown>>()
}));

vi.mock('@/lib/storage/app-storage', () => ({
  read: readMock,
  write: writeMock
}));

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerIdentifier(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

describe('collection-service', () => {
  it('hydrates null persisted state into empty object', () => {
    expect(hydrateCollectionState(null)).toEqual({});
  });

  it('hydrates and serializes set-backed collection state', () => {
    const hydrated = hydrateCollectionState({
      [asPageId('mex')]: [asStickerIdentifier('MEX-1'), asStickerIdentifier('MEX-2')]
    });

    expect(hydrated).toEqual({
      [asPageId('mex')]: {
        [asStickerIdentifier('MEX-1')]: 1,
        [asStickerIdentifier('MEX-2')]: 1
      }
    });

    expect(serializeCollectionState(hydrated)).toEqual({
      [asPageId('mex')]: {
        [asStickerIdentifier('MEX-1')]: 1,
        [asStickerIdentifier('MEX-2')]: 1
      }
    });
  });

  it('drops duplicate legacy sticker ids during hydration', () => {
    const hydrated = hydrateCollectionState({
      [asPageId('mex')]: [
        asStickerIdentifier('MEX-1'),
        asStickerIdentifier('MEX-1'),
        asStickerIdentifier('MEX-2')
      ]
    });

    expect(hydrated).toEqual({
      [asPageId('mex')]: {
        [asStickerIdentifier('MEX-2')]: 1
      }
    });
  });

  it('hydrates quantity payload and keeps repeated math unique-aware', () => {
    const hydrated = hydrateCollectionState({
      [asPageId('mex')]: {
        [asStickerIdentifier('MEX-1')]: 3,
        [asStickerIdentifier('MEX-2')]: 1
      }
    });

    expect(getStickerQuantity(hydrated, asPageId('mex'), asStickerIdentifier('MEX-1'))).toBe(3);
    expect(derivePageCollectedStickerIds(hydrated, asPageId('mex'))).toEqual(
      new Set([asStickerIdentifier('MEX-1'), asStickerIdentifier('MEX-2')])
    );
    expect(countUniqueCollectedStickers(hydrated)).toBe(2);
    expect(countRepeatedCopies(hydrated)).toBe(2);
  });

  it('drops malformed saved data instead of failing hydration', () => {
    const hydrated = hydrateCollectionState({
      [asPageId('mex')]: {
        [asStickerIdentifier('MEX-1')]: 0,
        [asStickerIdentifier('MEX-2')]: -1,
        'BAD-1': 4
      },
      unknown: ['MEX-1']
    } as never);

    expect(hydrated).toEqual({});
  });

  it('loads empty state on first launch when storage has no collection', async () => {
    readMock.mockResolvedValueOnce({ state: 'ready', value: null });

    const result = await loadCollectionState();
    expect(result).toEqual({ state: 'ready', value: {} });
  });

  it('toggles sticker in and out with immediate persistence', async () => {
    writeMock.mockResolvedValue({ state: 'ready' });

    const pageId = asPageId('mex');
    const stickerId = asStickerIdentifier('MEX-1');

    const firstToggle = await toggleStickerCollectionState({}, pageId, stickerId);
    expect(firstToggle).toEqual({
      state: 'ready',
      value: {
        [pageId]: {
          [stickerId]: 1
        }
      }
    });

    expect(writeMock).toHaveBeenNthCalledWith(1, 'collection', {
      [pageId]: {
        [stickerId]: 1
      }
    });

    const secondToggle = await toggleStickerCollectionState(
      firstToggle.state === 'ready' ? firstToggle.value : {},
      pageId,
      stickerId
    );

    expect(secondToggle).toEqual({ state: 'ready', value: {} });
    expect(writeMock).toHaveBeenNthCalledWith(2, 'collection', {});
  });

  it('returns non-ready state from loadCollectionState when storage unavailable', async () => {
    readMock.mockResolvedValueOnce({ state: 'unavailable' });

    const result = await loadCollectionState();
    expect(result).toEqual({ state: 'unavailable' });
  });

  it('returns normalized collection when normalization writeback fails during load', async () => {
    readMock.mockResolvedValueOnce({
      state: 'ready',
      value: {
        [asPageId('mex')]: [asStickerIdentifier('MEX-1')]
      }
    });
    writeMock.mockResolvedValueOnce({ state: 'unavailable' });

    const result = await loadCollectionState();

    expect(result).toEqual({
      state: 'ready',
      value: {
        [asPageId('mex')]: {
          [asStickerIdentifier('MEX-1')]: 1
        }
      }
    });
    expect(writeMock).toHaveBeenCalledWith('collection', {
      [asPageId('mex')]: {
        [asStickerIdentifier('MEX-1')]: 1
      }
    });
  });

  it('returns storage failure and does not commit next state', async () => {
    writeMock.mockResolvedValueOnce({ state: 'unavailable' });

    const result = await toggleStickerCollectionState(
      {},
      asPageId('mex'),
      asStickerIdentifier('MEX-1')
    );

    expect(result).toEqual({ state: 'unavailable' });
  });

  it('preserves existing stickers when overlapping updates use latest state', async () => {
    writeMock.mockResolvedValue({ state: 'ready' });

    const pageId = asPageId('mex');
    const firstStickerId = asStickerIdentifier('MEX-1');
    const secondStickerId = asStickerIdentifier('MEX-2');

    const firstUpdate = await updateStickerQuantity({}, pageId, firstStickerId, 1);
    const secondUpdate = await updateStickerQuantity(
      firstUpdate.state === 'ready' ? firstUpdate.value : {},
      pageId,
      secondStickerId,
      1
    );

    expect(secondUpdate).toEqual({
      state: 'ready',
      value: {
        [pageId]: {
          [firstStickerId]: 1,
          [secondStickerId]: 1
        }
      }
    });
  });
});

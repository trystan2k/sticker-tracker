import { describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import {
  hydrateCollectionState,
  loadCollectionState,
  serializeCollectionState,
  toggleStickerCollectionState
} from '@/services/collection_service';

const { readMock, writeMock } = vi.hoisted(() => ({
  readMock: vi.fn<() => Promise<unknown>>(),
  writeMock: vi.fn<() => Promise<unknown>>()
}));

vi.mock('@/lib/storage/app_storage', () => ({
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

describe('collection_service', () => {
  it('hydrates null persisted state into empty object', () => {
    expect(hydrateCollectionState(null)).toEqual({});
  });

  it('hydrates and serializes set-backed collection state', () => {
    const hydrated = hydrateCollectionState({
      [asPageId('mex')]: [asStickerIdentifier('MEX-1'), asStickerIdentifier('MEX-2')]
    });

    const mexicoPageState = hydrated[asPageId('mex')];
    expect(mexicoPageState).toBeInstanceOf(Set);
    expect(mexicoPageState).toBeDefined();
    expect([...(mexicoPageState ?? new Set())]).toEqual([
      asStickerIdentifier('MEX-1'),
      asStickerIdentifier('MEX-2')
    ]);

    expect(serializeCollectionState(hydrated)).toEqual({
      [asPageId('mex')]: [asStickerIdentifier('MEX-1'), asStickerIdentifier('MEX-2')]
    });
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
        [pageId]: new Set([stickerId])
      }
    });

    expect(writeMock).toHaveBeenNthCalledWith(1, 'collection', {
      [pageId]: [stickerId]
    });

    const secondToggle = await toggleStickerCollectionState(
      firstToggle.state === 'ready' ? firstToggle.value : {},
      pageId,
      stickerId
    );

    expect(secondToggle).toEqual({ state: 'ready', value: {} });
    expect(writeMock).toHaveBeenNthCalledWith(2, 'collection', {});
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
});

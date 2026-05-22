import { describe, expect, it } from 'vitest';

import { buildMissingState } from '@/components/missing/missing-state';
import { createCollectionState } from '../../helpers/typed-factories';

describe('buildMissingState', () => {
  it('returns pages with missing stickers in canonical album order', () => {
    const state = buildMissingState(
      createCollectionState({
        'fwc-opening': ['00', '1'],
        mex: ['MEX-1'],
        rsa: ['RSA-1']
      })
    );

    expect(state.kind).toBe('ready');

    if (state.kind !== 'ready') {
      return;
    }

    expect(state.pages[0]?.pageId).toBe('fwc-opening');
    expect(state.pages[1]?.pageId).toBe('mex');
    expect(state.pages[2]?.pageId).toBe('rsa');
    expect(state.sharePageIds.slice(0, 3)).toEqual(['fwc-opening', 'mex', 'rsa']);
  });

  it('omits fully collected pages and exposes counts', () => {
    const state = buildMissingState(
      createCollectionState({
        mex: [
          'MEX-1',
          'MEX-2',
          'MEX-3',
          'MEX-4',
          'MEX-5',
          'MEX-6',
          'MEX-7',
          'MEX-8',
          'MEX-9',
          'MEX-10',
          'MEX-11',
          'MEX-12',
          'MEX-13',
          'MEX-14',
          'MEX-15',
          'MEX-16',
          'MEX-17',
          'MEX-18',
          'MEX-19',
          'MEX-20'
        ],
        rsa: ['RSA-1']
      })
    );

    expect(state.kind).toBe('ready');

    if (state.kind !== 'ready') {
      return;
    }

    expect(state.pages.some((page) => page.pageId === 'mex')).toBe(false);

    const rsa = state.pages.find((page) => page.pageId === 'rsa');
    expect(rsa?.missingCount).toBe(19);
    expect(state.totalMissingCount).toBeGreaterThan(19);
    expect(state.collectedCount).toBe(21);
  });

  it('returns all-complete when no page has missing stickers', () => {
    const state = buildMissingState(createCollectionState({}));

    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') {
      return;
    }

    const fullCollection = Object.fromEntries(
      state.pages.map((page) => [page.pageId, page.missingStickerIds.map((id) => String(id))])
    );

    const doneState = buildMissingState(createCollectionState(fullCollection));

    expect(doneState).toMatchObject({
      kind: 'all-complete',
      totalMissingCount: 0,
      sharePageIds: []
    });
  });

  it('supports optimistic hidden stickers overlay', () => {
    const hiddenStickerIds = new Set(['MEX-2'] as const);
    const state = buildMissingState(createCollectionState({ mex: ['MEX-1'] }), {
      hiddenStickerIds: hiddenStickerIds as never
    });

    expect(state.kind).toBe('ready');

    if (state.kind !== 'ready') {
      return;
    }

    const mex = state.pages.find((page) => page.pageId === 'mex');
    expect(mex?.missingStickerIds.includes('MEX-2' as never)).toBe(false);
    expect(mex?.missingCount).toBe(18);
  });
});

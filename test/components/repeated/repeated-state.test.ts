import { describe, expect, it } from 'vitest';

import { buildRepeatedState } from '@/components/repeated/repeated-state';
import { createCollectionState } from '../../helpers/typed-factories';

describe('buildRepeatedState', () => {
  it('returns pages with repeated stickers in canonical album order', () => {
    const state = buildRepeatedState(
      createCollectionState({
        rsa: {
          'RSA-3': 2
        },
        mex: {
          'MEX-1': 3,
          'MEX-2': 2
        },
        'fwc-opening': {
          '00': 2
        }
      })
    );

    expect(state.kind).toBe('ready');

    if (state.kind !== 'ready') {
      return;
    }

    expect(state.pages.map((page) => page.pageId)).toEqual(['fwc-opening', 'mex', 'rsa']);
    expect(state.sharePageIds).toEqual(['fwc-opening', 'mex', 'rsa']);
  });

  it('omits pages without repeated copies', () => {
    const state = buildRepeatedState(
      createCollectionState({
        mex: {
          'MEX-1': 1,
          'MEX-2': 2
        },
        rsa: {
          'RSA-1': 1
        }
      })
    );

    expect(state.kind).toBe('ready');

    if (state.kind !== 'ready') {
      return;
    }

    expect(state.pages.map((page) => page.pageId)).toEqual(['mex']);
    expect(state.pages[0]?.repeatedStickerIds).toEqual(['MEX-2']);
  });

  it('computes repeated totals from copies only', () => {
    const state = buildRepeatedState(
      createCollectionState({
        mex: {
          'MEX-1': 3,
          'MEX-2': 2,
          'MEX-3': 1
        },
        rsa: {
          'RSA-1': 4
        }
      })
    );

    expect(state.kind).toBe('ready');

    if (state.kind !== 'ready') {
      return;
    }

    expect(state.totalRepeatedCount).toBe(6);
    expect(state.pages.map((page) => [page.pageId, page.repeatedCount])).toEqual([
      ['mex', 3],
      ['rsa', 3]
    ]);
  });

  it('returns empty when no repeated stickers remain', () => {
    expect(
      buildRepeatedState(
        createCollectionState({
          mex: {
            'MEX-1': 1
          }
        })
      )
    ).toEqual({
      kind: 'empty',
      totalRepeatedCount: 0,
      pages: [],
      sharePageIds: []
    });
  });
});

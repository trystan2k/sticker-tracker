import { describe, expect, it } from 'vitest';

import {
  buildRepeatedSharePreviewPayload,
  buildRepeatedShareSelectionSections,
  decodeRepeatedShareSelection,
  formatRepeatedShareEntry,
  parseRepeatedShareRouteSearch
} from '@/components/repeated-share/repeated-share-state';
import { albumPages } from '@/data/album';
import type { PageId, StickerIdentifier } from '@/data/album';
import { createCollectionState } from '../../helpers/typed-factories';

describe('repeated-share-state', () => {
  it('formats repeated entries with repeated copies only', () => {
    const teamPage = albumPages.find((page) => page.pageId === 'bra');

    if (!teamPage) {
      throw new Error('BRA page missing');
    }

    expect(formatRepeatedShareEntry(teamPage, 'BRA-10' as StickerIdentifier, 3)).toBe(
      'BRA 10 (x2)'
    );
  });

  it('builds selection sections with only repeated-shareable rows enabled', () => {
    const sections = buildRepeatedShareSelectionSections(
      createCollectionState({
        mex: {
          'MEX-1': 2
        },
        rsa: {
          'RSA-1': 1
        }
      })
    );

    const rows = sections.flatMap((section) => section.rows);

    expect(rows.find((row) => row.pageId === 'mex')?.stickerCount).toBe(1);
    expect(rows.find((row) => row.pageId === 'rsa')?.stickerCount).toBe(0);
  });

  it('builds repeated preview payload in canonical album order', () => {
    const payload = buildRepeatedSharePreviewPayload(
      createCollectionState({
        rsa: {
          'RSA-3': 2
        },
        bra: {
          'BRA-10': 3,
          'BRA-11': 2
        },
        'fwc-opening': {
          '00': 2
        }
      }),
      ['rsa' as PageId, 'fwc-opening' as PageId, 'bra' as PageId]
    );

    expect(payload.selectedPageIds).toEqual(['fwc-opening', 'rsa', 'bra']);
    expect(payload.totalStickerCount).toBe(5);

    const pageBlocks = payload.sections.flatMap((section) => section.pages);

    expect(pageBlocks.map((page) => page.pageId)).toEqual(['fwc-opening', 'rsa', 'bra']);
    expect(pageBlocks[0]?.compressedStickerText).toBe('FWC 00 (x1)');
    expect(pageBlocks[1]?.compressedStickerText).toBe('RSA 3 (x1)');
    expect(pageBlocks[2]?.compressedStickerText).toBe('BRA 10 (x2), BRA 11 (x1)');
  });

  it('drops pages without repeated stickers from preview payload', () => {
    const payload = buildRepeatedSharePreviewPayload(
      createCollectionState({
        mex: {
          'MEX-1': 1,
          'MEX-2': 2
        }
      }),
      ['mex' as PageId, 'rsa' as PageId]
    );

    expect(payload.selectedPageIds).toEqual(['mex', 'rsa']);
    expect(payload.sections.flatMap((section) => section.pages).map((page) => page.pageId)).toEqual(
      ['mex']
    );
  });

  it('parses repeated-share search contract', () => {
    expect(parseRepeatedShareRouteSearch({ pages: 'mex,rsa', from: '/repeated' })).toEqual({
      pages: 'mex,rsa',
      from: '/repeated'
    });

    expect(parseRepeatedShareRouteSearch({ pages: 'mex', from: 'invalid' })).toEqual({
      pages: 'mex',
      from: '/repeated'
    });

    expect(parseRepeatedShareRouteSearch({})).toEqual({
      from: '/repeated'
    });

    expect(decodeRepeatedShareSelection('rsa,invalid,mex')).toEqual(['mex', 'rsa']);
  });
});

import { describe, expect, it } from 'vitest';

import { albumPages, type PageId, type StickerIdentifier } from '@/data/album';
import type { CollectionState } from '@/services/collection-service';
import {
  buildInitialShareSelection,
  buildSharePreviewPayload,
  buildShareSelectionSections,
  compressMissingStickerIds,
  decodeShareSelection,
  encodeShareSelection,
  sanitizeFromPath
} from '@/components/share/share-state';

function makeCollection(entries: Record<string, string[]>): CollectionState {
  const result: Record<string, ReadonlySet<StickerIdentifier>> = {};

  for (const [pageId, stickerIds] of Object.entries(entries)) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    result[pageId] = new Set(stickerIds) as unknown as ReadonlySet<StickerIdentifier>;
  }

  return result as unknown as CollectionState;
}

describe('share-state', () => {
  it('global preset returns only pages with missing stickers', () => {
    const mexPage = albumPages.find((page) => page.pageId === 'mex')!;
    const collection = makeCollection({
      mex: [...mexPage.stickerIds] as unknown as string[]
    });

    const selected = buildInitialShareSelection(collection, { type: 'all-missing' });

    expect(selected).not.toContain('mex');
    expect(selected).toContain('fwc-opening');
    expect(selected.length).toBe(albumPages.length - 1);
  });

  it('current-page preset returns empty when page fully collected', () => {
    const mexPage = albumPages.find((page) => page.pageId === 'mex')!;
    const collection = makeCollection({
      mex: [...mexPage.stickerIds] as unknown as string[]
    });

    const selected = buildInitialShareSelection(collection, {
      type: 'current-page',
      pageId: 'mex' as PageId
    });

    expect(selected).toEqual([]);
  });

  it('current-page preset returns page when partially collected', () => {
    const mexPage = albumPages.find((page) => page.pageId === 'mex')!;
    const partialStickers = mexPage.stickerIds.slice(0, 2) as unknown as string[];
    const collection = makeCollection({ mex: partialStickers });

    const selected = buildInitialShareSelection(collection, {
      type: 'current-page',
      pageId: 'mex' as PageId
    });

    expect(selected).toEqual(['mex']);
  });

  it('current-page preset returns empty for non-existent page', () => {
    const collection = makeCollection({});

    const selected = buildInitialShareSelection(collection, {
      type: 'current-page',
      pageId: 'nonexistent' as PageId
    });

    expect(selected).toEqual([]);
  });

  it('buildShareSelectionSections returns sections with rows', () => {
    const collection = makeCollection({});
    const sections = buildShareSelectionSections(collection);

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.sectionId).toBeDefined();
    expect(sections[0]?.sectionLabel).toBeDefined();
    expect(sections[0]?.rows.length).toBeGreaterThan(0);
    expect(sections[0]?.rows[0]?.pageId).toBeDefined();
    expect(sections[0]?.rows[0]?.missingCount).toBeGreaterThan(0);
  });

  it('buildShareSelectionSections rows have correct pageType for team pages', () => {
    const collection = makeCollection({});
    const sections = buildShareSelectionSections(collection);
    const teamSection = sections.find((s) => s.rows.some((r) => r.pageType === 'team'));

    expect(teamSection).toBeDefined();
    const teamRow = teamSection?.rows.find((r) => r.pageType === 'team');
    expect(teamRow?.pageType).toBe('team');
    expect(teamRow?.flagCode).toBeDefined();
    expect(teamRow?.group).toBeDefined();
  });

  it('buildShareSelectionSections rows have correct pageType for special pages', () => {
    const collection = makeCollection({});
    const sections = buildShareSelectionSections(collection);
    const specialSection = sections.find((s) => s.rows.some((r) => r.pageType === 'special'));

    expect(specialSection).toBeDefined();
    const specialRow = specialSection?.rows.find((r) => r.pageType === 'special');
    expect(specialRow?.pageType).toBe('special');
    expect(specialRow?.specialKey).toBeDefined();
  });

  it('buildSharePreviewPayload returns empty payload for empty selection', () => {
    const collection = makeCollection({});
    const payload = buildSharePreviewPayload(collection, []);

    expect(payload.selectedPageIds).toEqual([]);
    expect(payload.selectedPageCount).toBe(0);
    expect(payload.totalMissingStickerCount).toBe(0);
    expect(payload.sections).toEqual([]);
  });

  it('buildSharePreviewPayload returns data for single page selection', () => {
    const collection = makeCollection({});
    const payload = buildSharePreviewPayload(collection, ['mex' as PageId]);

    expect(payload.selectedPageIds).toContain('mex');
    expect(payload.selectedPageCount).toBe(1);
    expect(payload.totalMissingStickerCount).toBeGreaterThan(0);
    expect(payload.sections.length).toBeGreaterThan(0);
  });

  it('buildSharePreviewPayload returns data for multiple page selection', () => {
    const collection = makeCollection({});
    const payload = buildSharePreviewPayload(collection, [
      'mex' as PageId,
      'fwc-opening' as PageId
    ]);

    expect(payload.selectedPageIds).toContain('mex');
    expect(payload.selectedPageIds).toContain('fwc-opening');
    expect(payload.selectedPageCount).toBe(2);
    expect(payload.totalMissingStickerCount).toBeGreaterThan(0);
  });

  it('buildSharePreviewPayload preserves album order', () => {
    const collection = makeCollection({});
    const payload = buildSharePreviewPayload(collection, [
      'fwc-opening' as PageId,
      'mex' as PageId
    ]);

    const mexIndex = payload.selectedPageIds.indexOf('mex' as PageId);
    const fwcIndex = payload.selectedPageIds.indexOf('fwc-opening' as PageId);
    expect(fwcIndex).toBeLessThan(mexIndex);
  });

  it('buildSharePreviewPayload filters out non-canonical page ids', () => {
    const collection = makeCollection({});
    const payload = buildSharePreviewPayload(collection, ['invalid' as PageId, 'mex' as PageId]);

    expect(payload.selectedPageIds).not.toContain('invalid');
    expect(payload.selectedPageIds).toContain('mex');
  });

  it('invalid and duplicate page ids are filtered in decodeShareSelection', () => {
    const decoded = decodeShareSelection('coca-cola,invalid,mex,mex,fwc-opening,FWC-OPENING');

    expect(decoded).toEqual(['fwc-opening', 'mex', 'coca-cola']);
  });

  it('decodeShareSelection returns empty for empty string', () => {
    expect(decodeShareSelection('')).toEqual([]);
  });

  it('decodeShareSelection returns empty for undefined', () => {
    expect(decodeShareSelection(undefined)).toEqual([]);
  });

  it('decodeShareSelection returns empty for null', () => {
    expect(decodeShareSelection(null)).toEqual([]);
  });

  it('decodeShareSelection handles mixed valid and invalid pageIds', () => {
    const decoded = decodeShareSelection('mex,not-a-page,fwc-opening');

    expect(decoded).toEqual(['fwc-opening', 'mex']);
  });

  it('sanitizeFromPath returns / for empty string', () => {
    expect(sanitizeFromPath('')).toBe('/');
  });

  it('sanitizeFromPath returns / for undefined', () => {
    expect(sanitizeFromPath(undefined)).toBe('/');
  });

  it('sanitizeFromPath returns / for null', () => {
    expect(sanitizeFromPath(null)).toBe('/');
  });

  it('sanitizeFromPath returns / for non-path string', () => {
    expect(sanitizeFromPath('share')).toBe('/');
  });

  it('sanitizeFromPath returns / for just /', () => {
    expect(sanitizeFromPath('/')).toBe('/');
  });

  it('sanitizeFromPath returns valid path unchanged', () => {
    expect(sanitizeFromPath('/album')).toBe('/album');
  });

  it('sanitizeFromPath returns valid path with segments unchanged', () => {
    expect(sanitizeFromPath('/album/mex')).toBe('/album/mex');
  });

  it('compressed sticker text is correct for team, fwc and cc stickers', () => {
    const team = compressMissingStickerIds([
      'BRA-1',
      'BRA-2',
      'BRA-3',
      'BRA-5',
      'BRA-10'
    ] as unknown as readonly StickerIdentifier[]);
    const fwc = compressMissingStickerIds(['00', '05'] as unknown as readonly StickerIdentifier[]);
    const cc = compressMissingStickerIds([
      'CC1',
      'CC4',
      'CC5',
      'CC6',
      'CC7'
    ] as unknown as readonly StickerIdentifier[]);

    expect(team).toBe('1-3, 5, 10');
    expect(fwc).toBe('00, 05');
    expect(cc).toBe('CC1, CC4-CC7');
  });

  it('compressed sticker text returns empty for empty array', () => {
    expect(compressMissingStickerIds([])).toBe('');
  });

  it('compressed sticker text handles single sticker', () => {
    const single = compressMissingStickerIds(['BRA-5'] as unknown as readonly StickerIdentifier[]);
    expect(single).toBe('5');
  });

  it('compressed sticker text handles full consecutive range', () => {
    const range = compressMissingStickerIds([
      'BRA-1',
      'BRA-2',
      'BRA-3',
      'BRA-4',
      'BRA-5'
    ] as unknown as readonly StickerIdentifier[]);
    expect(range).toBe('1-5');
  });

  it('compressed sticker text handles CC full range', () => {
    const ccRange = compressMissingStickerIds([
      'CC1',
      'CC2',
      'CC3'
    ] as unknown as readonly StickerIdentifier[]);
    expect(ccRange).toBe('CC1-CC3');
  });

  it('compressed sticker text handles mixed pattern as comma-separated', () => {
    const mixed = compressMissingStickerIds([
      'BRA-1',
      'CC2',
      '03'
    ] as unknown as readonly StickerIdentifier[]);
    expect(mixed).toBe('BRA-1, CC2, 03');
  });

  it('compressed sticker text keeps numeric ranges across digit boundaries', () => {
    const numeric = compressMissingStickerIds([
      '9',
      '10',
      '11',
      '19'
    ] as unknown as readonly StickerIdentifier[]);

    expect(numeric).toBe('9-11, 19');
  });

  it('buildSharePreviewPayload filters selected pages with zero missing stickers', () => {
    const mexPage = albumPages.find((page) => page.pageId === 'mex')!;
    const collection = makeCollection({
      mex: [...mexPage.stickerIds] as unknown as string[]
    });

    const payload = buildSharePreviewPayload(collection, [
      'mex' as PageId,
      'fwc-opening' as PageId
    ]);

    expect(payload.selectedPageIds).toEqual(['fwc-opening', 'mex']);
    const allPageIds = payload.sections.flatMap((section) =>
      section.pages.map((page) => page.pageId)
    );
    expect(allPageIds).toEqual(['fwc-opening']);
  });

  it('full-album selection preserves album order', () => {
    const reversed = albumPages
      .map((page) => page.pageId)
      .toReversed() as unknown as readonly PageId[];

    const encoded = encodeShareSelection(reversed);

    expect(encoded).toBe(albumPages.map((page) => page.pageId).join(','));
  });

  it('encodeShareSelection returns undefined for empty array', () => {
    expect(encodeShareSelection([])).toBeUndefined();
  });

  it('encodeShareSelection returns undefined for non-canonical ids only', () => {
    const result = encodeShareSelection(['invalid' as PageId]);
    expect(result).toBeUndefined();
  });

  it('encode decode roundtrip works', () => {
    const original = ['mex', 'fwc-opening', 'coca-cola'] as unknown as readonly PageId[];

    const encoded = encodeShareSelection(original);
    const decoded = decodeShareSelection(encoded);

    expect(decoded).toEqual(['fwc-opening', 'mex', 'coca-cola']);
  });

  it('compressed sticker text handles numeric stickers with same numeric value (localeCompare branch)', () => {
    // '05' and '5' both parse to numeric 5 — triggers localeCompare in sort
    const result = compressMissingStickerIds([
      '05',
      '5'
    ] as unknown as readonly StickerIdentifier[]);

    expect(result).toBeTruthy();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageId, StickerIdentifier } from '@/data/album';
import { albumPages } from '@/data/album';
import {
  buildScannerLookupIndex,
  ensureScannerLookupIndex,
  findScannerMatch,
  getScannerLookupVersion
} from '@/services/scanner-lookup';

const { readMock, writeMock } = vi.hoisted(() => ({
  readMock: vi.fn<(key: string) => Promise<unknown>>(),
  writeMock: vi.fn<(key: string, value: unknown) => Promise<unknown>>()
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

describe('scanner-lookup', () => {
  describe('getScannerLookupVersion', () => {
    it('returns a positive number', () => {
      const version = getScannerLookupVersion();
      expect(version).toBeGreaterThan(0);
    });

    it('returns same version for same album data', () => {
      const v1 = getScannerLookupVersion();
      const v2 = getScannerLookupVersion();
      expect(v1).toBe(v2);
    });

    it('changes when relevant field value changes even with same length', () => {
      const originalTranslationKey = albumPages[0]?.translationKey;

      if (!originalTranslationKey) {
        throw new Error('Expected first album page to exist');
      }

      const originalVersion = getScannerLookupVersion();
      const sameLengthMutatedValue =
        originalTranslationKey.slice(0, -1) + (originalTranslationKey.endsWith('x') ? 'y' : 'x');

      // oxlint-disable-next-line typescript/no-non-null-assertion,typescript/no-unsafe-member-access,typescript/no-unsafe-type-assertion
      (albumPages[0] as { translationKey: string }).translationKey = sameLengthMutatedValue;
      const nextVersion = getScannerLookupVersion();

      // oxlint-disable-next-line typescript/no-non-null-assertion,typescript/no-unsafe-member-access,typescript/no-unsafe-type-assertion
      (albumPages[0] as { translationKey: string }).translationKey = originalTranslationKey;

      expect(nextVersion).not.toBe(originalVersion);
    });
  });

  describe('buildScannerLookupIndex', () => {
    it('builds index with correct version', () => {
      const index = buildScannerLookupIndex();
      expect(index.version).toBe(getScannerLookupVersion());
    });

    it('contains entries for all album pages', () => {
      const index = buildScannerLookupIndex();
      const totalStickers = albumPages.reduce((sum, page) => sum + page.stickerIds.length, 0);
      expect(Object.keys(index.entries).length).toBe(totalStickers);
    });

    it('contains entry for opening sticker 00', () => {
      const index = buildScannerLookupIndex();
      const entry = index.entries['00'];
      expect(entry).toBeDefined();
      expect(entry?.pageType).toBe('special');
      expect(entry?.pageId).toBe(asPageId('fwc-opening'));
    });

    it('contains entry for CC1', () => {
      const index = buildScannerLookupIndex();
      const entry = index.entries['CC1'];
      expect(entry).toBeDefined();
      expect(entry?.pageType).toBe('special');
      expect(entry?.pageId).toBe(asPageId('coca-cola'));
    });

    it('contains entry for team sticker MEX-1', () => {
      const index = buildScannerLookupIndex();
      const entry = index.entries['MEX-1'];
      expect(entry).toBeDefined();
      expect(entry?.pageType).toBe('team');
      expect(entry?.albumCode).toBe('MEX');
      expect(entry?.group).toBe('A');
      expect(entry?.flagCode).toBe('mx');
    });

    it('team entries have albumCode, group, flagCode', () => {
      const index = buildScannerLookupIndex();
      const entry = index.entries['BRA-5'];
      expect(entry?.albumCode).toBe('BRA');
      expect(entry?.group).toBe('C');
      expect(entry?.flagCode).toBe('br');
    });

    it('special entries have null albumCode, group, flagCode', () => {
      const index = buildScannerLookupIndex();
      const entry = index.entries['00'];
      expect(entry?.albumCode).toBeNull();
      expect(entry?.group).toBeNull();
      expect(entry?.flagCode).toBeNull();
    });
  });

  describe('findScannerMatch', () => {
    it('returns entry for known sticker code', () => {
      const index = buildScannerLookupIndex();
      const result = findScannerMatch(index, 'MEX-1');
      expect(result).not.toBeNull();
      expect(result?.stickerId).toBe(asStickerIdentifier('MEX-1'));
    });

    it('returns null for unknown sticker code', () => {
      const index = buildScannerLookupIndex();
      const result = findScannerMatch(index, 'XXX-999');
      expect(result).toBeNull();
    });

    it('returns null for empty code', () => {
      const index = buildScannerLookupIndex();
      const result = findScannerMatch(index, '');
      expect(result).toBeNull();
    });
  });

  describe('ensureScannerLookupIndex', () => {
    beforeEach(() => {
      vi.resetModules();
      readMock.mockReset();
      writeMock.mockReset();
    });

    it('returns null when storage unavailable', async () => {
      readMock.mockResolvedValueOnce({ state: 'unavailable' });

      const result = await ensureScannerLookupIndex();
      expect(result).toBeNull();
    });

    it('returns null when write fails during rebuild', async () => {
      readMock.mockResolvedValueOnce({ state: 'ready', value: null });
      writeMock.mockResolvedValueOnce({ state: 'unavailable' });

      const result = await ensureScannerLookupIndex();
      expect(result).toBeNull();
    });

    it('uses cached version from storage when version matches', async () => {
      const expectedVersion = getScannerLookupVersion();
      const storedIndex = buildScannerLookupIndex();
      readMock.mockResolvedValueOnce({ state: 'ready', value: storedIndex });

      const result = await ensureScannerLookupIndex();
      expect(result).not.toBeNull();
      expect(result?.version).toBe(expectedVersion);
      expect(result).toBe(storedIndex);
    });

    it('reads from storage and caches when no cached version', async () => {
      const expectedVersion = getScannerLookupVersion();
      readMock.mockResolvedValueOnce({ state: 'ready', value: null });
      writeMock.mockResolvedValueOnce({ state: 'ready' });

      const result = await ensureScannerLookupIndex();
      expect(result).not.toBeNull();
      expect(result?.version).toBe(expectedVersion);
    });

    it('uses cached version when available', async () => {
      const storedIndex = buildScannerLookupIndex();
      readMock
        .mockResolvedValueOnce({ state: 'ready', value: storedIndex })
        .mockResolvedValueOnce({ state: 'ready', value: storedIndex });

      const first = await ensureScannerLookupIndex();
      const second = await ensureScannerLookupIndex();

      expect(second).toBe(first);
      expect(readMock).toHaveBeenCalledTimes(2);
      expect(writeMock).not.toHaveBeenCalled();
    });

    it('rebuilds lookup when storage entry is missing even after cache exists', async () => {
      const existingIndex = buildScannerLookupIndex();

      readMock
        .mockResolvedValueOnce({ state: 'ready', value: existingIndex })
        .mockResolvedValueOnce({ state: 'ready', value: null });
      writeMock.mockResolvedValueOnce({ state: 'ready' });

      const first = await ensureScannerLookupIndex();
      const second = await ensureScannerLookupIndex();

      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(readMock).toHaveBeenCalledTimes(2);
      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(
        'scannerLookup',
        expect.objectContaining({
          version: getScannerLookupVersion()
        })
      );
    });
  });

  describe('lookupSticker', () => {
    beforeEach(() => {
      // Reset the lookupCache module variable by re-importing
      vi.resetModules();
    });

    async function getLookupSticker() {
      const mod = await import('@/services/scanner-lookup');
      return mod.lookupSticker;
    }

    it('returns parse-failed for unparseable input', async () => {
      const lookupSticker = await getLookupSticker();
      const result = await lookupSticker('garbage text');
      expect(result).toEqual({
        state: 'unmatched',
        reason: 'parse-failed',
        parsedCode: null
      });
    });

    it('returns storage-unavailable when lookup index cannot be loaded', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockResolvedValue({ state: 'unavailable' });

      const result = await lookupSticker('BRA-1');
      expect(result.state).toBe('unmatched');
      if (result.state === 'unmatched') {
        expect(result.reason).toBe('storage-unavailable');
      }
    });

    it('returns unknown-sticker for valid code not in album', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return { state: 'ready', value: null };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('XXX-999');
      expect(result).toEqual({
        state: 'unmatched',
        reason: 'unknown-sticker',
        parsedCode: 'XXX-999'
      });
    });

    it('returns matched for known sticker with missing status', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return { state: 'ready', value: null };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('BRA-1');
      expect(result.state).toBe('matched');
      if (result.state === 'matched') {
        expect(result.stickerId).toBe(asStickerIdentifier('BRA-1'));
        expect(result.pageId).toBe(asPageId('bra'));
        expect(result.pageType).toBe('team');
        expect(result.hasSticker).toBe(false);
        expect(result.missingSticker).toBe(true);
      }
    });

    it('parses noisy OCR input and matches sticker', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return { state: 'ready', value: null };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('WORLD CUP 2026 | [CAN 14]');
      expect(result.state).toBe('matched');

      if (result.state === 'matched') {
        expect(result.stickerId).toBe(asStickerIdentifier('CAN-14'));
      }
    });

    it('returns matched with hasSticker=true when already collected', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return {
            state: 'ready',
            value: {
              bra: [asStickerIdentifier('BRA-1')]
            }
          };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('BRA-1');
      expect(result.state).toBe('matched');
      if (result.state === 'matched') {
        expect(result.hasSticker).toBe(true);
        expect(result.missingSticker).toBe(false);
      }
    });

    it('treats quantity collections as already owned', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return {
            state: 'ready',
            value: {
              bra: { 'BRA-1': 4 }
            }
          };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('BRA-1');
      expect(result.state).toBe('matched');
      if (result.state === 'matched') {
        expect(result.hasSticker).toBe(true);
        expect(result.missingSticker).toBe(false);
      }
    });

    it('handles opening sticker 00 lookup', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return { state: 'ready', value: null };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('00');
      expect(result.state).toBe('matched');
      if (result.state === 'matched') {
        expect(result.stickerId).toBe(asStickerIdentifier('00'));
        expect(result.pageId).toBe(asPageId('fwc-opening'));
      }
    });

    it('handles CC code lookup', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return { state: 'ready', value: null };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('CC5');
      expect(result.state).toBe('matched');
      if (result.state === 'matched') {
        expect(result.stickerId).toBe(asStickerIdentifier('CC5'));
        expect(result.pageId).toBe(asPageId('coca-cola'));
      }
    });

    it('returns storage-unavailable when collection read fails', async () => {
      const lookupSticker = await getLookupSticker();
      readMock.mockImplementation(async (key: string) => {
        if (key === 'scannerLookup') {
          return { state: 'ready', value: buildScannerLookupIndex() };
        }
        if (key === 'collection') {
          return { state: 'unavailable' };
        }
        return { state: 'ready', value: null };
      });

      const result = await lookupSticker('BRA-1');
      expect(result.state).toBe('unmatched');
      if (result.state === 'unmatched') {
        expect(result.reason).toBe('storage-unavailable');
        expect(result.parsedCode).toBe('BRA-1');
      }
    });
  });
});

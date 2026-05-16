import { describe, expect, it } from 'vitest';

import { parseStickerNumber } from '@/services/scanner-parser';

describe('scanner-parser', () => {
  describe('parseStickerNumber', () => {
    it('matches team code formats', () => {
      expect(parseStickerNumber('BRA-12')).toEqual({ state: 'matched', code: 'BRA-12' });
      expect(parseStickerNumber('BRA 12')).toEqual({ state: 'matched', code: 'BRA-12' });
      expect(parseStickerNumber('BRA12')).toEqual({ state: 'matched', code: 'BRA-12' });
      expect(parseStickerNumber('bra-01')).toEqual({ state: 'matched', code: 'BRA-1' });
      expect(parseStickerNumber('USA-100')).toEqual({ state: 'matched', code: 'USA-100' });
    });

    it('matches CC formats', () => {
      expect(parseStickerNumber('CC1')).toEqual({ state: 'matched', code: 'CC1' });
      expect(parseStickerNumber('CC 7')).toEqual({ state: 'matched', code: 'CC7' });
      expect(parseStickerNumber('cc14')).toEqual({ state: 'matched', code: 'CC14' });
    });

    it('matches opening sticker 00 standalone', () => {
      expect(parseStickerNumber('00')).toEqual({ state: 'matched', code: '00' });
      expect(parseStickerNumber('OPENING 00 STICKER')).toEqual({ state: 'matched', code: '00' });
    });

    it('extracts team code from noisy OCR text (user repro)', () => {
      expect(parseStickerNumber('WORLD CUP 2026 | [CAN 14]')).toEqual({
        state: 'matched',
        code: 'CAN-14'
      });
    });

    it('extracts embedded team variants from noisy OCR text', () => {
      expect(parseStickerNumber('foo CAN-14 bar')).toEqual({ state: 'matched', code: 'CAN-14' });
      expect(parseStickerNumber('foo CAN 14 bar')).toEqual({ state: 'matched', code: 'CAN-14' });
      expect(parseStickerNumber('foo CAN14 bar')).toEqual({ state: 'matched', code: 'CAN-14' });
    });

    it('extracts embedded CC variants from noisy OCR text', () => {
      expect(parseStickerNumber('sponsor code CC1 confirmed')).toEqual({
        state: 'matched',
        code: 'CC1'
      });
      expect(parseStickerNumber('sponsor code CC 1 confirmed')).toEqual({
        state: 'matched',
        code: 'CC1'
      });
      expect(parseStickerNumber('sponsor code CC14 confirmed')).toEqual({
        state: 'matched',
        code: 'CC14'
      });
    });

    it('avoids false positive for 00 inside larger numbers', () => {
      expect(parseStickerNumber('WORLD CUP 2026')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('ABC200DEF')).toEqual({ state: 'unmatched' });
    });

    it('rejects invalid values', () => {
      expect(parseStickerNumber('')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('   ')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('hello world')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('CC0')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('CC15')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('AB-1')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('ABCD-1')).toEqual({ state: 'unmatched' });
      expect(parseStickerNumber('BRA-1234')).toEqual({ state: 'unmatched' });
    });
  });
});

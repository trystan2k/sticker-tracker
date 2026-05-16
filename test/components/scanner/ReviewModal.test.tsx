import { describe, expect, it } from 'vitest';

import { parseStickerNumber } from '@/services/scanner-parser';

// ReviewModal uses getValidationState internally which calls parseStickerNumber.
// These tests exercise the validation branches that feed into canConfirm logic.
// Component rendering tests are in ReviewModal.browser.test.tsx.

describe('ReviewModal validation branches (unit)', () => {
  describe('parseStickerNumber branches (used by getValidationState)', () => {
    it('returns unmatched for garbage input (hasInvalid branch)', () => {
      const parsed = parseStickerNumber('garbage text');
      expect(parsed.state).toBe('unmatched');
    });

    it('returns matched for valid team code', () => {
      const parsed = parseStickerNumber('BRA-12');
      expect(parsed.state).toBe('matched');
      if (parsed.state === 'matched') {
        expect(parsed.code).toBe('BRA-12');
      }
    });

    it('returns matched for opening sticker 00', () => {
      const parsed = parseStickerNumber('00');
      expect(parsed.state).toBe('matched');
      if (parsed.state === 'matched') {
        expect(parsed.code).toBe('00');
      }
    });

    it('returns matched for valid CC code', () => {
      const parsed = parseStickerNumber('CC5');
      expect(parsed.state).toBe('matched');
      if (parsed.state === 'matched') {
        expect(parsed.code).toBe('CC5');
      }
    });

    it('normalizes whitespace and produces canonical code', () => {
      const parsed = parseStickerNumber('BRA  12');
      expect(parsed.state).toBe('matched');
      if (parsed.state === 'matched') {
        expect(parsed.code).toBe('BRA-12');
      }
    });

    it('produces same canonical code for equivalent inputs (duplicate branch)', () => {
      const p1 = parseStickerNumber('BRA-12');
      const p2 = parseStickerNumber('BRA 12');
      expect(p1.state).toBe('matched');
      expect(p2.state).toBe('matched');
      if (p1.state === 'matched' && p2.state === 'matched') {
        expect(p1.code).toBe(p2.code);
      }
    });

    it('rejects CC code out of range', () => {
      const parsed = parseStickerNumber('CC99');
      expect(parsed.state).toBe('unmatched');
    });

    it('rejects empty string', () => {
      const parsed = parseStickerNumber('');
      expect(parsed.state).toBe('unmatched');
    });
  });
});

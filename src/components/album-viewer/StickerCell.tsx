import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from 'react';

import { useTranslation } from 'react-i18next';

import type { AlbumPage, StickerIdentifier } from '@/data/album';

import {
  getNextStickerQuantityForDoubleTap,
  getNextStickerQuantityForSingleTap,
  STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS
} from './sticker-cell-interactions';

import styles from './StickerCell.module.css';

type StickerCellProps = Readonly<{
  page: AlbumPage;
  stickerId: StickerIdentifier;
  quantity: number;
  onSetStickerQuantity: (stickerId: StickerIdentifier, quantity: number) => void;
  disabled?: boolean;
  dataTestId?: string;
}>;

function isKeyboardActivationKey(event: KeyboardEvent<HTMLButtonElement>): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

function isKeyboardDecrementKey(event: KeyboardEvent<HTMLButtonElement>): boolean {
  return event.key === 'Backspace' || event.key === 'Delete';
}

function getStickerCodeAndNumber(
  page: AlbumPage,
  stickerId: StickerIdentifier
): Readonly<{ code: string; number: string }> {
  if (page.type === 'team') {
    return {
      code: page.albumCode,
      number: stickerId.replace(`${page.albumCode}-`, '')
    };
  }

  if (page.key === 'coca-cola') {
    return {
      code: 'CC',
      number: stickerId.replace('CC', '')
    };
  }

  return {
    code: 'FWC',
    number: stickerId
  };
}

export function StickerCell({
  page,
  stickerId,
  quantity,
  onSetStickerQuantity,
  disabled = false,
  dataTestId
}: StickerCellProps) {
  const { t } = useTranslation();
  const { code, number } = getStickerCodeAndNumber(page, stickerId);
  const keyboardHintId = useId();
  const pendingTapTimeoutRef = useRef<number | null>(null);
  const pendingTapQuantityRef = useRef<number | null>(null);
  const latestQuantityRef = useRef(quantity);
  const suppressNextClickRef = useRef(false);
  const isCollected = quantity > 0;
  const repeatedCount = Math.max(0, quantity - 1);
  const repeatedDescription = t('album.sticker.repeatedCopies', { count: repeatedCount });

  useEffect(() => {
    latestQuantityRef.current = quantity;
  }, [quantity]);

  const clearPendingTap = useCallback((): number | null => {
    const pendingQuantity = pendingTapQuantityRef.current;

    if (pendingTapTimeoutRef.current !== null) {
      window.clearTimeout(pendingTapTimeoutRef.current);
      pendingTapTimeoutRef.current = null;
    }

    pendingTapQuantityRef.current = null;
    return pendingQuantity;
  }, []);

  const commitQuantity = useCallback(
    (nextQuantity: number) => {
      latestQuantityRef.current = nextQuantity;
      onSetStickerQuantity(stickerId, nextQuantity);
    },
    [onSetStickerQuantity, stickerId]
  );

  const flushPendingSingleTap = useCallback(() => {
    const pendingQuantity = clearPendingTap();

    if (pendingQuantity === null) {
      return;
    }

    commitQuantity(getNextStickerQuantityForSingleTap(pendingQuantity));
  }, [clearPendingTap, commitQuantity]);

  useEffect(() => {
    return () => {
      flushPendingSingleTap();
    };
  }, [flushPendingSingleTap]);

  const handleClick = useCallback(() => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (disabled) {
      return;
    }

    const currentQuantity = latestQuantityRef.current;

    if (currentQuantity <= 0) {
      clearPendingTap();
      commitQuantity(getNextStickerQuantityForSingleTap(currentQuantity));
      return;
    }

    if (pendingTapTimeoutRef.current !== null) {
      const baseQuantity = pendingTapQuantityRef.current ?? currentQuantity;
      clearPendingTap();
      commitQuantity(getNextStickerQuantityForDoubleTap(baseQuantity));
      return;
    }

    pendingTapQuantityRef.current = currentQuantity;
    pendingTapTimeoutRef.current = window.setTimeout(() => {
      const baseQuantity = pendingTapQuantityRef.current;

      if (baseQuantity === null) {
        return;
      }

      clearPendingTap();
      commitQuantity(getNextStickerQuantityForSingleTap(baseQuantity));
    }, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS);
  }, [clearPendingTap, commitQuantity, disabled]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      if (isKeyboardActivationKey(event)) {
        event.preventDefault();
        suppressNextClickRef.current = true;

        const pendingQuantity = clearPendingTap();

        if (pendingQuantity !== null) {
          commitQuantity(getNextStickerQuantityForSingleTap(pendingQuantity));
        }

        commitQuantity(getNextStickerQuantityForSingleTap(latestQuantityRef.current));

        return;
      }

      if (!isCollected || !isKeyboardDecrementKey(event)) {
        return;
      }

      event.preventDefault();
      suppressNextClickRef.current = true;
      clearPendingTap();
      commitQuantity(getNextStickerQuantityForDoubleTap(latestQuantityRef.current));
    },
    [clearPendingTap, commitQuantity, disabled, isCollected]
  );

  const ariaLabel =
    repeatedCount > 0
      ? t('album.sticker.ariaLabelWithRepeated', {
          id: stickerId,
          state: isCollected ? t('album.sticker.collected') : t('album.sticker.missing'),
          repeatedCount: repeatedDescription
        })
      : t('album.sticker.ariaLabel', {
          id: stickerId,
          state: isCollected ? t('album.sticker.collected') : t('album.sticker.missing')
        });
  const keyboardHint = isCollected
    ? t('album.sticker.keyboardHintCollected')
    : t('album.sticker.keyboardHintMissing');

  return (
    <button
      type="button"
      className={`${styles.cell} ${isCollected ? styles.collected : styles.missing}`}
      aria-pressed={isCollected}
      aria-label={ariaLabel}
      aria-describedby={keyboardHintId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {repeatedCount > 0 ? (
        <span className={styles.badge} aria-hidden="true">
          {repeatedCount}
        </span>
      ) : null}
      <span className={styles.code}>{code}</span>
      <span className={styles.number}>{number}</span>
      <span id={keyboardHintId} className={styles.srOnly}>
        {keyboardHint}
      </span>
    </button>
  );
}

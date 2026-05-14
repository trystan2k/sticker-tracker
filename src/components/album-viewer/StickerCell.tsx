import { useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import type { AlbumPage, StickerIdentifier } from '@/data/album';

import styles from './StickerCell.module.css';

type StickerCellProps = Readonly<{
  page: AlbumPage;
  stickerId: StickerIdentifier;
  isCollected: boolean;
  onToggleSticker: (stickerId: StickerIdentifier) => void;
  disabled?: boolean;
}>;

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
  isCollected,
  onToggleSticker,
  disabled = false
}: StickerCellProps) {
  const { t } = useTranslation();
  const { code, number } = getStickerCodeAndNumber(page, stickerId);

  const handleClick = useCallback(() => {
    onToggleSticker(stickerId);
  }, [onToggleSticker, stickerId]);

  return (
    <button
      type="button"
      className={`${styles.cell} ${isCollected ? styles.collected : styles.missing}`}
      aria-pressed={isCollected}
      aria-label={t('album.sticker.ariaLabel', {
        id: stickerId,
        state: isCollected ? t('album.sticker.collected') : t('album.sticker.missing')
      })}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className={styles.code}>{code}</span>
      <span className={styles.number}>{number}</span>
    </button>
  );
}

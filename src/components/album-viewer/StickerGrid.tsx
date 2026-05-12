import type { AlbumPage, StickerIdentifier } from '@/data/album';

import { StickerCell } from './StickerCell';
import styles from './StickerGrid.module.css';

type StickerGridProps = Readonly<{
  page: AlbumPage;
  collectedStickerIds: ReadonlySet<StickerIdentifier>;
  onToggleSticker: (stickerId: StickerIdentifier) => void;
  disabled?: boolean;
}>;

export function StickerGrid({
  page,
  collectedStickerIds,
  onToggleSticker,
  disabled = false
}: StickerGridProps) {
  const isCocaColaPage = page.type === 'special' && page.key === 'coca-cola';

  return (
    <section className={styles.section}>
      <div className={`${styles.grid} ${isCocaColaPage ? styles.gridFive : styles.gridFour}`}>
        {page.stickerIds.map((stickerId) => (
          <StickerCell
            key={stickerId}
            page={page}
            stickerId={stickerId}
            isCollected={collectedStickerIds.has(stickerId)}
            onToggleSticker={onToggleSticker}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}

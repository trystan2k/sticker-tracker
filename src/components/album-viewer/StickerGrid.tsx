import type { AlbumPage, StickerIdentifier } from '@/data/album';

import { StickerCell } from './StickerCell';
import styles from './StickerGrid.module.css';

type StickerGridProps = Readonly<{
  page: AlbumPage;
  visibleStickerIds?: readonly StickerIdentifier[];
  collectedStickerIds: ReadonlySet<StickerIdentifier>;
  onToggleSticker: (stickerId: StickerIdentifier) => void;
  disabled?: boolean;
}>;

export function StickerGrid({
  page,
  visibleStickerIds,
  collectedStickerIds,
  onToggleSticker,
  disabled = false
}: StickerGridProps) {
  const stickerIds = visibleStickerIds ?? page.stickerIds;

  return (
    <section className={styles.section}>
      <div className={`${styles.grid} ${styles.gridItems}`}>
        {stickerIds.map((stickerId) => (
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

import type { AlbumPage, StickerIdentifier } from '@/data/album';

import { StickerCell } from './StickerCell';
import styles from './StickerGrid.module.css';

type StickerGridProps = Readonly<{
  page: AlbumPage;
  visibleStickerIds?: readonly StickerIdentifier[];
  collectedStickerIds: ReadonlySet<StickerIdentifier>;
  stickerQuantities: Readonly<Partial<Record<StickerIdentifier, number>>>;
  onSetStickerQuantity: (stickerId: StickerIdentifier, quantity: number) => void;
  disabled?: boolean;
}>;

export function StickerGrid({
  page,
  visibleStickerIds,
  collectedStickerIds,
  stickerQuantities,
  onSetStickerQuantity,
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
            quantity={stickerQuantities[stickerId] ?? (collectedStickerIds.has(stickerId) ? 1 : 0)}
            onSetStickerQuantity={onSetStickerQuantity}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}

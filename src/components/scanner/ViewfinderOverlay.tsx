import styles from './ViewfinderOverlay.module.css';

type ViewfinderOverlayProps = Readonly<{
  isScanning: boolean;
  onViewfinderElementChange?: (element: HTMLDivElement | null) => void;
}>;

export function ViewfinderOverlay({
  isScanning,
  onViewfinderElementChange
}: ViewfinderOverlayProps) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.dimTop} />
      <div className={styles.middleRow}>
        <div className={styles.dimSide} />
        <div ref={onViewfinderElementChange} className={styles.viewfinder}>
          <span className={styles.cornerTopLeft} />
          <span className={styles.cornerTopRight} />
          <span className={styles.cornerBottomLeft} />
          <span className={styles.cornerBottomRight} />
          <span className={`${styles.scanLine} ${isScanning ? styles.scanLineActive : ''}`} />
        </div>
        <div className={styles.dimSide} />
      </div>
      <div className={styles.dimBottom} />
    </div>
  );
}

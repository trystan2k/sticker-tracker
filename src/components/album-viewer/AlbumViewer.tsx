import { ChevronsLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AlbumPage, StickerIdentifier } from '@/data/album';

import { AlbumPageHeader } from './AlbumPageHeader';
import { PageProgress } from './PageProgress';
import { StickerGrid } from './StickerGrid';
import styles from './AlbumViewer.module.css';

type AlbumViewerProps = Readonly<{
  page: AlbumPage;
  renderState: 'loading' | 'ready';
  collectedStickerIds: ReadonlySet<StickerIdentifier>;
  onToggleSticker: (stickerId: StickerIdentifier) => void;
}>;

export function AlbumViewer({
  page,
  renderState,
  collectedStickerIds,
  onToggleSticker
}: AlbumViewerProps) {
  const { t } = useTranslation();
  const isLoading = renderState === 'loading';

  return (
    <div className={styles.viewer}>
      <AlbumPageHeader page={page} />

      <PageProgress collectedCount={collectedStickerIds.size} totalCount={page.stickerIds.length} />

      <section className={styles.filterRow} aria-label={t('album.filters.label')}>
        <button type="button" disabled className={`${styles.filterPill} ${styles.filterActive}`}>
          {t('album.filters.all')}
        </button>
        <button type="button" disabled className={styles.filterPill}>
          {t('album.filters.collected')}
        </button>
        <button type="button" disabled className={styles.filterPill}>
          {t('album.filters.missing')}
        </button>
      </section>

      {isLoading ? (
        <div className={styles.loadingState} aria-live="polite" aria-busy="true">
          <p>{t('album.loading')}</p>
          <div className={styles.loadingGrid}>
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className={styles.loadingCell} />
            ))}
          </div>
        </div>
      ) : (
        <StickerGrid
          page={page}
          collectedStickerIds={collectedStickerIds}
          onToggleSticker={onToggleSticker}
          disabled={isLoading}
        />
      )}

      <div className={styles.swipeHint}>
        <ChevronsLeftRight size={16} aria-hidden="true" />
        <span>{t('album.swipeHint')}</span>
      </div>

      <div className={styles.safeArea} aria-hidden="true">
        <span className={styles.homeIndicator} />
      </div>
    </div>
  );
}

import { ChevronsLeftRight } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { AlbumPage, StickerIdentifier } from '@/data/album';

import { AlbumPageHeader } from './AlbumPageHeader';
import { PageProgress } from './PageProgress';
import { StickerGrid } from './StickerGrid';
import { applyStickerFilter, type ViewerFilter } from './viewer-state';
import styles from './AlbumViewer.module.css';

type AlbumViewerProps = Readonly<{
  page: AlbumPage;
  renderState: 'loading' | 'ready';
  collectedStickerIds: ReadonlySet<StickerIdentifier>;
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
  onOpenQuickNavigation: () => void;
  onToggleSticker: (stickerId: StickerIdentifier) => void;
}>;

export function AlbumViewer({
  page,
  renderState,
  collectedStickerIds,
  activeFilter,
  onChangeFilter,
  onOpenQuickNavigation,
  onToggleSticker
}: AlbumViewerProps) {
  const { t } = useTranslation();
  const isLoading = renderState === 'loading';
  const visibleStickerIds = applyStickerFilter(page.stickerIds, collectedStickerIds, activeFilter);
  const hasVisibleStickers = visibleStickerIds.length > 0;

  const handleFilterAll = useCallback(() => onChangeFilter('all'), [onChangeFilter]);
  const handleFilterCollected = useCallback(() => onChangeFilter('collected'), [onChangeFilter]);
  const handleFilterMissing = useCallback(() => onChangeFilter('missing'), [onChangeFilter]);

  return (
    <div className={styles.viewer}>
      <div className={styles.headerSection}>
        <AlbumPageHeader page={page} onOpenQuickNavigation={onOpenQuickNavigation} />
      </div>

      <PageProgress collectedCount={collectedStickerIds.size} totalCount={page.stickerIds.length} />

      <section className={styles.filterRow} aria-label={t('album.filters.label')}>
        <button
          type="button"
          aria-pressed={activeFilter === 'all'}
          onClick={handleFilterAll}
          className={`${styles.filterPill} ${activeFilter === 'all' ? styles.filterActive : ''}`}
        >
          {t('album.filters.all')}
        </button>
        <button
          type="button"
          aria-pressed={activeFilter === 'collected'}
          onClick={handleFilterCollected}
          className={`${styles.filterPill} ${activeFilter === 'collected' ? styles.filterActive : ''}`}
        >
          {t('album.filters.collected')}
        </button>
        <button
          type="button"
          aria-pressed={activeFilter === 'missing'}
          onClick={handleFilterMissing}
          className={`${styles.filterPill} ${activeFilter === 'missing' ? styles.filterActive : ''}`}
        >
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
      ) : hasVisibleStickers ? (
        <StickerGrid
          page={page}
          visibleStickerIds={visibleStickerIds}
          collectedStickerIds={collectedStickerIds}
          onToggleSticker={onToggleSticker}
          disabled={isLoading}
        />
      ) : (
        <div className={styles.emptyState} role="status" aria-live="polite">
          {t('album.filters.emptyState')}
        </div>
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

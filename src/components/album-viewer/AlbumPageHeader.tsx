import { Camera, EllipsisVertical, Share2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import type { AlbumPage } from '@/data/album';

import styles from './AlbumPageHeader.module.css';

type AlbumPageHeaderProps = Readonly<{
  page: AlbumPage;
}>;

export function AlbumPageHeader({ page }: AlbumPageHeaderProps) {
  const { t } = useTranslation();
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const handleOpenLocaleModal = useCallback((): void => {
    setIsLocaleModalOpen(true);
  }, []);
  const handleCloseLocaleModal = useCallback((): void => {
    setIsLocaleModalOpen(false);
  }, []);

  const centerContent =
    page.type === 'team' ? (
      <>
        <span className={`fi fi-${page.flagCode} ${styles.flag}`} aria-hidden="true" />
        <span className={styles.teamName}>{t(page.translationKey)}</span>
        <span className={styles.dot} aria-hidden="true">
          •
        </span>
        <span className={styles.group}>{t(`group.${page.group.toLowerCase()}`)}</span>
      </>
    ) : (
      <>
        <span className={styles.specialName}>{t(page.translationKey)}</span>
        <span className={styles.dot} aria-hidden="true">
          •
        </span>
        <span className={styles.group}>{t(`album.specialSection.${page.key}`)}</span>
      </>
    );

  return (
    <>
      <header className={styles.header} aria-label={t('album.pageHeader.ariaLabel')}>
        <div className={styles.logo}>COPA 26</div>

        <div className={styles.center}>{centerContent}</div>

        <div className={styles.actions}>
          <Camera size={22} aria-hidden="true" />
          <Share2 size={22} aria-hidden="true" />
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleOpenLocaleModal}
            aria-label={t('locale.label')}
          >
            <EllipsisVertical size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      <LocaleSwitcher isOpen={isLocaleModalOpen} onClose={handleCloseLocaleModal} />
    </>
  );
}

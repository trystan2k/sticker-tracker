import { Camera, EllipsisVertical, Share2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import type { AlbumPage } from '@/data/album';

import styles from './AlbumPageHeader.module.css';

type AlbumPageHeaderProps = Readonly<{
  page: AlbumPage;
  onOpenQuickNavigation: () => void;
}>;

export function AlbumPageHeader({ page, onOpenQuickNavigation }: AlbumPageHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const handleOpenLocaleModal = useCallback((): void => {
    setIsLocaleModalOpen(true);
  }, []);
  const handleCloseLocaleModal = useCallback((): void => {
    setIsLocaleModalOpen(false);
  }, []);
  const handleNavigateHome = useCallback((): void => {
    void navigate({ to: '/' });
  }, [navigate]);

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
        <button type="button" className={styles.logo} onClick={handleNavigateHome}>
          COPA 26
        </button>

        <button
          type="button"
          className={styles.centerTrigger}
          onClick={onOpenQuickNavigation}
          aria-label={t('album.quickNavigation.open')}
        >
          <div className={styles.center}>{centerContent}</div>
        </button>

        <div className={styles.actions}>
          <button
            type="button"
            disabled
            className={styles.actionBtn}
            aria-label={t('album.actions.camera')}
          >
            <Camera size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled
            className={styles.actionBtn}
            aria-label={t('album.actions.share')}
          >
            <Share2 size={22} aria-hidden="true" />
          </button>
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

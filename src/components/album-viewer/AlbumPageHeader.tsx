import { Menu } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import type { AlbumPage } from '@/data/album';

import styles from './AlbumPageHeader.module.css';

type AlbumPageHeaderProps = Readonly<{
  page: AlbumPage;
  onOpenQuickNavigation: () => void;
  onOpenShare?: (() => void) | undefined;
}>;

export function AlbumPageHeader({
  page,
  onOpenQuickNavigation,
  onOpenShare
}: AlbumPageHeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);

  const handleOpenMenuDrawer = useCallback((): void => {
    setIsMenuDrawerOpen(true);
  }, []);

  const handleCloseMenuDrawer = useCallback((): void => {
    setIsMenuDrawerOpen(false);
  }, []);

  const handleOpenLocaleModalFromDrawer = useCallback((): void => {
    setIsMenuDrawerOpen(false);
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
        <button
          type="button"
          className={styles.menuButton}
          onClick={handleOpenMenuDrawer}
          aria-label={t('home.header.openMenu')}
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <button type="button" className={styles.logo} onClick={handleNavigateHome}>
          {t('share.brandName')}
        </button>

        <button
          type="button"
          className={styles.centerTrigger}
          onClick={onOpenQuickNavigation}
          aria-label={t('album.quickNavigation.open')}
        >
          <div className={styles.center}>{centerContent}</div>
        </button>
      </header>

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={handleCloseMenuDrawer}
        onOpenLocaleSwitcher={handleOpenLocaleModalFromDrawer}
        onOpenShare={onOpenShare}
        currentLocale={i18n.resolvedLanguage ?? i18n.language ?? 'en'}
      />
      <LocaleSwitcher isOpen={isLocaleModalOpen} onClose={handleCloseLocaleModal} />
    </>
  );
}

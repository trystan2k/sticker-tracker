import { Camera, Menu } from 'lucide-react';
import { useCallback, useContext, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { FEATURE_FLAGS } from '@/config/features';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import { ThemeSheet } from '@/components/ThemeSheet';
import type { AlbumPage } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';
import type { ThemeValue } from '@/services/theme-service';

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
  const appState = useContext(AppStateContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const originPathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);

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

  const handleOpenThemeSheet = useCallback((): void => {
    setIsThemeSheetOpen(true);
  }, []);

  const handleCloseThemeSheet = useCallback((): void => {
    setIsThemeSheetOpen(false);
  }, []);

  const handleNavigateHome = useCallback((): void => {
    void navigate({ to: '/' });
  }, [navigate]);

  const handleNavigateToScanner = useCallback((): void => {
    void navigate({
      to: '/scanner',
      search: {
        origin: originPathname
      }
    });
  }, [navigate, originPathname]);

  const handleOpenDeleteConfirm = useCallback(async (): Promise<void> => {
    // oxlint-disable-next-line no-alert
    const isConfirmed = window.confirm(
      `${t('drawer.delete_confirm_title')}\n\n${t('drawer.delete_confirm')}`
    );

    if (!isConfirmed) {
      return;
    }

    await appState?.resetAppData();
    await navigate({ to: '/' });
  }, [appState, navigate, t]);

  const handleSelectTheme = useCallback(
    (theme: ThemeValue): void => {
      if (!appState) {
        return;
      }

      void appState.setTheme(theme);
    },
    [appState]
  );

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

        {FEATURE_FLAGS.scannerEnabled && (
          <button
            type="button"
            className={styles.menuButton}
            onClick={handleNavigateToScanner}
            aria-label={t('scanner.title')}
          >
            <Camera size={24} aria-hidden="true" />
          </button>
        )}
      </header>

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={handleCloseMenuDrawer}
        onOpenLocaleSwitcher={handleOpenLocaleModalFromDrawer}
        onOpenThemeSwitcher={handleOpenThemeSheet}
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        onOpenShare={onOpenShare}
        currentLocale={i18n.resolvedLanguage ?? i18n.language ?? 'en'}
      />
      <LocaleSwitcher isOpen={isLocaleModalOpen} onClose={handleCloseLocaleModal} />
      <ThemeSheet
        isOpen={isThemeSheetOpen}
        onClose={handleCloseThemeSheet}
        currentTheme={appState?.theme ?? 'system'}
        onSelectTheme={handleSelectTheme}
      />
    </>
  );
}

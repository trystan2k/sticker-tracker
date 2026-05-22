import { Menu } from 'lucide-react';
import { useCallback, useContext, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { BackupRestoreSheet } from '@/components/BackupRestoreSheet';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import { ThemeSheet } from '@/components/ThemeSheet';
import type { AlbumPage } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';
import type { CollectionState } from '@/services/collection-service';
import type { SupportedLocale } from '@/services/locale-service';
import type { ThemeValue } from '@/services/theme-service';

import styles from './AlbumPageHeader.module.css';

type AlbumPageHeaderProps = Readonly<{
  page: AlbumPage;
  onOpenQuickNavigation: () => void;
  onOpenShare?: (() => void) | undefined;
}>;

const EMPTY_COLLECTION: CollectionState = {};
const unavailableRestoreCollection = async () => ({ state: 'unavailable' as const });

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
  const [isBackupRestoreSheetOpen, setIsBackupRestoreSheetOpen] = useState(false);
  const collection = appState?.collection ?? EMPTY_COLLECTION;

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

  const handleOpenBackupRestore = useCallback((): void => {
    setIsBackupRestoreSheetOpen(true);
  }, []);

  const handleCloseBackupRestoreSheet = useCallback((): void => {
    setIsBackupRestoreSheetOpen(false);
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

  const handleOpenMissing = useCallback((): void => {
    void navigate({ to: '/missing' });
  }, [navigate]);

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

  const handleRestoreLocale = useCallback(
    async (locale: SupportedLocale) => {
      await appState?.setLocale(locale);
    },
    [appState]
  );

  const handleRestoreTheme = useCallback(
    async (theme: ThemeValue) => {
      await appState?.setTheme(theme);
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

        <div className={styles.menuButton} aria-hidden="true" />
      </header>

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={handleCloseMenuDrawer}
        onOpenLocaleSwitcher={handleOpenLocaleModalFromDrawer}
        onOpenThemeSwitcher={handleOpenThemeSheet}
        onOpenBackupRestore={handleOpenBackupRestore}
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        onOpenShare={onOpenShare}
        onOpenMissing={handleOpenMissing}
        onOpenScanner={handleNavigateToScanner}
        currentLocale={i18n.resolvedLanguage ?? i18n.language ?? 'en'}
      />
      <LocaleSwitcher isOpen={isLocaleModalOpen} onClose={handleCloseLocaleModal} />
      <ThemeSheet
        isOpen={isThemeSheetOpen}
        onClose={handleCloseThemeSheet}
        currentTheme={appState?.theme ?? 'system'}
        onSelectTheme={handleSelectTheme}
      />
      <BackupRestoreSheet
        isOpen={isBackupRestoreSheetOpen}
        onClose={handleCloseBackupRestoreSheet}
        collection={collection}
        locale={appState?.locale ?? 'en'}
        theme={appState?.theme ?? 'system'}
        onRestoreCollection={appState?.restoreCollection ?? unavailableRestoreCollection}
        onRestoreLocale={handleRestoreLocale}
        onRestoreTheme={handleRestoreTheme}
      />
    </>
  );
}

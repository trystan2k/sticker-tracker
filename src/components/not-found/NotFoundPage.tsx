import { SearchX } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BackupRestoreSheet } from '@/components/BackupRestoreSheet';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import { ThemeSheet } from '@/components/ThemeSheet';
import { buildInitialShareSelection, encodeShareSelection } from '@/components/share/share-state';
import { HomeHeader } from '@/components/home/HomeHeader';
import { AppStateContext } from '@/providers/AppStateProvider';
import type { CollectionState } from '@/services/collection-service';
import type { SupportedLocale } from '@/services/locale-service';
import type { ThemeValue } from '@/services/theme-service';

import styles from './NotFoundPage.module.css';

const EMPTY_COLLECTION: CollectionState = {};
const unavailableRestoreCollection = async () => ({ state: 'unavailable' as const });

export function NotFoundPage() {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleSwitcherOpen, setIsLocaleSwitcherOpen] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [isBackupRestoreSheetOpen, setIsBackupRestoreSheetOpen] = useState(false);
  const collection = appState?.collection ?? EMPTY_COLLECTION;

  const handleOpenMenuDrawer = useCallback(() => {
    setIsMenuDrawerOpen(true);
  }, []);

  const handleCloseMenuDrawer = useCallback(() => {
    setIsMenuDrawerOpen(false);
  }, []);

  const handleOpenLocaleSwitcher = useCallback(() => {
    setIsLocaleSwitcherOpen(true);
  }, []);

  const handleCloseLocaleSwitcher = useCallback(() => {
    setIsLocaleSwitcherOpen(false);
  }, []);

  const handleOpenThemeSheet = useCallback(() => {
    setIsThemeSheetOpen(true);
  }, []);

  const handleCloseThemeSheet = useCallback(() => {
    setIsThemeSheetOpen(false);
  }, []);

  const handleOpenBackupRestore = useCallback(() => {
    setIsBackupRestoreSheetOpen(true);
  }, []);

  const handleCloseBackupRestoreSheet = useCallback(() => {
    setIsBackupRestoreSheetOpen(false);
  }, []);

  const handleOpenDeleteConfirm = useCallback(async () => {
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
    (theme: ThemeValue) => {
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

  const handleOpenScanner = useCallback(() => {
    const originPathname = typeof window === 'undefined' ? '/' : window.location.pathname;

    void navigate({
      to: '/scanner',
      search: {
        origin: originPathname
      }
    });
  }, [navigate]);

  const handleOpenShare = useCallback(() => {
    if (!appState || appState.renderState !== 'ready') {
      return;
    }

    const pageIds = buildInitialShareSelection(appState.collection, { type: 'all-missing' });
    const pages = encodeShareSelection(pageIds);

    void navigate({
      to: '/share',
      search: {
        ...(pages ? { pages } : {}),
        from: '/'
      }
    });
  }, [appState, navigate]);

  const handleOpenMissing = useCallback(() => {
    void navigate({ to: '/missing' });
  }, [navigate]);

  const handleOpenRepeated = useCallback(() => {
    void navigate({ to: '/repeated' });
  }, [navigate]);

  return (
    <main className={styles.screen}>
      <HomeHeader onMenuClick={handleOpenMenuDrawer} />

      <section className={styles.content}>
        <div className={styles.body}>
          <SearchX className={styles.icon} size={64} aria-hidden="true" />

          <div className={styles.textGroup}>
            <h1 className={styles.heading}>{t('notFound.heading')}</h1>
            <p className={styles.description}>{t('notFound.description')}</p>
          </div>

          <Link to="/" className={styles.cta}>
            {t('notFound.ctaLabel')}
          </Link>
        </div>
      </section>

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={handleCloseMenuDrawer}
        onOpenLocaleSwitcher={handleOpenLocaleSwitcher}
        onOpenThemeSwitcher={handleOpenThemeSheet}
        onOpenBackupRestore={handleOpenBackupRestore}
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        onOpenShare={handleOpenShare}
        onOpenMissing={handleOpenMissing}
        onOpenRepeated={handleOpenRepeated}
        onOpenScanner={handleOpenScanner}
        currentLocale={i18n.resolvedLanguage ?? i18n.language}
      />
      <LocaleSwitcher isOpen={isLocaleSwitcherOpen} onClose={handleCloseLocaleSwitcher} />
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
    </main>
  );
}

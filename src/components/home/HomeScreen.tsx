import { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { BackupRestoreSheet } from '@/components/BackupRestoreSheet';
import { MenuDrawer } from '@/components/MenuDrawer';
import { ThemeSheet } from '@/components/ThemeSheet';
import { buildInitialShareSelection, encodeShareSelection } from '@/components/share/share-state';
import { AppStateContext } from '@/providers/AppStateProvider';
import { trackAnalyticsEvent } from '@/services/analytics-service';

import type { CollectionState } from '@/services/collection-service';
import type { SupportedLocale } from '@/services/locale-service';
import type { ThemeValue } from '@/services/theme-service';

import { HomeGroupCards } from './HomeGroupCards';
import { HomeHeader } from './HomeHeader';
import { HomeHeroProgress } from './HomeHeroProgress';
import { HomeSpecialCards } from './HomeSpecialCards';
import { computeGroupsData, computeHomeSummary, computeSpecialPagesData } from './home-state';
import styles from './HomeScreen.module.css';

const EMPTY_COLLECTION: CollectionState = {};
const unavailableRestoreCollection = async () => ({ state: 'unavailable' as const });

export function HomeScreen() {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleSwitcherOpen, setIsLocaleSwitcherOpen] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [isBackupRestoreSheetOpen, setIsBackupRestoreSheetOpen] = useState(false);

  const collection = appState?.collection ?? EMPTY_COLLECTION;

  const summary = useMemo(() => {
    const baseSummary = computeHomeSummary(collection);
    const numberFormatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
      maximumFractionDigits: 0
    });
    const percentFormatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });

    return {
      ...baseSummary,
      collectedFormatted: numberFormatter.format(baseSummary.collectedTotal),
      totalFormatted: numberFormatter.format(baseSummary.albumTotal),
      percentFormatted: `${percentFormatter.format(baseSummary.percentage)}%`
    };
  }, [collection, i18n.language, i18n.resolvedLanguage]);

  const groups = useMemo(() => computeGroupsData(collection), [collection]);
  const specialCards = useMemo(() => computeSpecialPagesData(collection), [collection]);
  const openingCard = useMemo(
    () => specialCards.find((card) => card.key === 'fwc-opening'),
    [specialCards]
  );
  const otherSpecialCards = useMemo(
    () => specialCards.filter((card) => card.key !== 'fwc-opening'),
    [specialCards]
  );
  const openingSpecialCards = useMemo(() => (openingCard ? [openingCard] : []), [openingCard]);

  const handleOpenMenuDrawer = useCallback(() => {
    setIsMenuDrawerOpen(true);
  }, []);

  const handleCloseMenuDrawer = useCallback(() => {
    setIsMenuDrawerOpen(false);
  }, []);

  const handleOpenLocaleSwitcher = useCallback(() => {
    setIsLocaleSwitcherOpen(true);
  }, []);

  const handleOpenShare = useCallback(() => {
    const pageIds = buildInitialShareSelection(appState!.collection, { type: 'all-missing' });
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

  const handleOpenScanner = useCallback(() => {
    const originPathname = typeof window === 'undefined' ? '/' : window.location.pathname;

    void navigate({
      to: '/scanner',
      search: {
        origin: originPathname
      }
    });
  }, [navigate]);

  const handleOpenStats = useCallback(() => {
    const sourcePath = typeof window === 'undefined' ? '/' : window.location.pathname;

    void trackAnalyticsEvent('stats_cta_clicked', {
      source_path: sourcePath
    });

    void navigate({
      to: '/stat',
      search: {
        from: sourcePath
      }
    });
  }, [navigate]);

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
      void appState?.setTheme(theme);
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

  if (appState === null) {
    return null;
  }

  if (appState.renderState !== 'ready') {
    return <div className={styles.loading}>{t('storage.loading')}</div>;
  }

  return (
    <div className={styles.screen}>
      <HomeHeader onMenuClick={handleOpenMenuDrawer} />

      <div className={styles.scrollArea}>
        <HomeHeroProgress
          summary={summary}
          completeLabel={t('home.hero.complete')}
          collectedFormatted={summary.collectedFormatted}
          totalFormatted={summary.totalFormatted}
          percentFormatted={summary.percentFormatted}
          ringAriaLabel={t('home.hero.ariaLabel')}
          openStatsLabel={t('home.hero.openStats')}
          onOpenStats={handleOpenStats}
        />
        {openingSpecialCards.length > 0 ? (
          <HomeSpecialCards
            cards={openingSpecialCards}
            sectionTitle={t('home.specials.openingTitle')}
          />
        ) : null}
        <HomeGroupCards groups={groups} />
        <HomeSpecialCards cards={otherSpecialCards} sectionTitle={t('home.specials.title')} />

        <section className={styles.safeArea} aria-hidden="true">
          <div className={styles.homeIndicator} />
        </section>
      </div>

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={handleCloseMenuDrawer}
        onOpenLocaleSwitcher={handleOpenLocaleSwitcher}
        onOpenThemeSwitcher={handleOpenThemeSheet}
        onOpenBackupRestore={handleOpenBackupRestore}
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        onOpenShare={handleOpenShare}
        onOpenMissing={handleOpenMissing}
        onOpenScanner={handleOpenScanner}
        currentLocale={appState.locale}
      />
      <LocaleSwitcher isOpen={isLocaleSwitcherOpen} onClose={handleCloseLocaleSwitcher} />
      <ThemeSheet
        isOpen={isThemeSheetOpen}
        onClose={handleCloseThemeSheet}
        currentTheme={appState.theme}
        onSelectTheme={handleSelectTheme}
      />
      <BackupRestoreSheet
        isOpen={isBackupRestoreSheetOpen}
        onClose={handleCloseBackupRestoreSheet}
        collection={collection}
        locale={appState.locale}
        theme={appState.theme}
        onRestoreCollection={appState?.restoreCollection ?? unavailableRestoreCollection}
        onRestoreLocale={handleRestoreLocale}
        onRestoreTheme={handleRestoreTheme}
      />
    </div>
  );
}

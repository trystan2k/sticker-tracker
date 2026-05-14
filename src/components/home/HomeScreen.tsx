import { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import { buildInitialShareSelection, encodeShareSelection } from '@/components/share/share-state';
import { AppStateContext } from '@/providers/AppStateProvider';

import type { CollectionState } from '@/services/collection-service';

import { HomeGroupCards } from './HomeGroupCards';
import { HomeHeader } from './HomeHeader';
import { HomeHeroProgress } from './HomeHeroProgress';
import { HomeSpecialCards } from './HomeSpecialCards';
import { computeGroupsData, computeHomeSummary, computeSpecialPagesData } from './home-state';
import styles from './HomeScreen.module.css';

const EMPTY_COLLECTION: CollectionState = {};

export function HomeScreen() {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleSwitcherOpen, setIsLocaleSwitcherOpen] = useState(false);

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
    if (!appState) {
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

  const handleCloseLocaleSwitcher = useCallback(() => {
    setIsLocaleSwitcherOpen(false);
  }, []);

  if (appState === null) {
    return null;
  }

  if (appState.renderState !== 'ready') {
    return <main className={styles.loading}>{t('storage.loading')}</main>;
  }

  return (
    <main className={styles.screen}>
      <HomeHeader onMenuClick={handleOpenMenuDrawer} />

      <div className={styles.scrollArea}>
        <HomeHeroProgress
          summary={summary}
          completeLabel={t('home.hero.complete')}
          collectedFormatted={summary.collectedFormatted}
          totalFormatted={summary.totalFormatted}
          percentFormatted={summary.percentFormatted}
          ringAriaLabel={t('home.hero.ariaLabel')}
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
        onOpenShare={handleOpenShare}
        currentLocale={appState.locale}
      />
      <LocaleSwitcher isOpen={isLocaleSwitcherOpen} onClose={handleCloseLocaleSwitcher} />
    </main>
  );
}

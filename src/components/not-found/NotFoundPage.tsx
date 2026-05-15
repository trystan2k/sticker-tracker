import { SearchX } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import { ThemeSheet } from '@/components/ThemeSheet';
import { HomeHeader } from '@/components/home/HomeHeader';
import { AppStateContext } from '@/providers/AppStateProvider';
import type { ThemeValue } from '@/services/theme-service';

import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleSwitcherOpen, setIsLocaleSwitcherOpen] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);

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
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        currentLocale={i18n.resolvedLanguage ?? i18n.language}
      />
      <LocaleSwitcher isOpen={isLocaleSwitcherOpen} onClose={handleCloseLocaleSwitcher} />
      <ThemeSheet
        isOpen={isThemeSheetOpen}
        onClose={handleCloseThemeSheet}
        currentTheme={appState?.theme ?? 'system'}
        onSelectTheme={handleSelectTheme}
      />
    </main>
  );
}

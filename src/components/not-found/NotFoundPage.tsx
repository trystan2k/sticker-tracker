import { SearchX } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuDrawer } from '@/components/MenuDrawer';
import { HomeHeader } from '@/components/home/HomeHeader';

import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const { t, i18n } = useTranslation();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLocaleSwitcherOpen, setIsLocaleSwitcherOpen] = useState(false);

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
        currentLocale={i18n.resolvedLanguage ?? i18n.language}
      />
      <LocaleSwitcher isOpen={isLocaleSwitcherOpen} onClose={handleCloseLocaleSwitcher} />
    </main>
  );
}

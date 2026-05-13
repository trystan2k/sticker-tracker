import { Menu, Share2 } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import styles from './HomeHeader.module.css';

interface HomeHeaderProps {
  onOpenLocaleSwitcher: () => void;
}

export function HomeHeader({ onOpenLocaleSwitcher }: HomeHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigateHome = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);

  return (
    <header className={styles.header} aria-label={t('home.header.ariaLabel')}>
      <button
        type="button"
        className={`${styles.actionButton} ${styles.menuButton}`}
        onClick={onOpenLocaleSwitcher}
        aria-label={t('home.header.openLocaleMenu')}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={styles.titleButton}
        onClick={handleNavigateHome}
        aria-label={t('home.header.title')}
      >
        <h1 className={styles.title}>{t('home.header.title')}</h1>
      </button>

      <button
        type="button"
        className={`${styles.actionButton} ${styles.shareButton}`}
        aria-label={t('home.header.shareAlbum')}
        disabled
      >
        <Share2 size={22} aria-hidden="true" />
      </button>
    </header>
  );
}

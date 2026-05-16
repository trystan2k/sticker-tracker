import { Camera, Menu } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { FEATURE_FLAGS } from '@/config/features';

import styles from './HomeHeader.module.css';

interface HomeHeaderProps {
  onMenuClick: () => void;
}

export function HomeHeader({ onMenuClick }: HomeHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const originPathname = typeof window === 'undefined' ? '/' : window.location.pathname;

  const handleNavigateHome = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);

  const handleNavigateToScanner = useCallback(() => {
    void navigate({
      to: '/scanner',
      search: {
        origin: originPathname
      }
    });
  }, [navigate, originPathname]);

  return (
    <header className={styles.header} aria-label={t('home.header.ariaLabel')}>
      <button
        type="button"
        className={`${styles.actionButton} ${styles.menuButton}`}
        onClick={onMenuClick}
        aria-label={t('home.header.openMenu')}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={styles.titleButton}
        onClick={handleNavigateHome}
        aria-label={t('home.header.title')}
      >
        <span className={styles.title}>{t('home.header.title')}</span>
      </button>

      {FEATURE_FLAGS.scannerEnabled && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleNavigateToScanner}
          aria-label={t('scanner.title')}
        >
          <Camera size={22} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}

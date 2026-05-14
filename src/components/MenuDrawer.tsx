import { ChevronRight, Menu, Share2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { APP_VERSION } from '@/version';

import styles from './MenuDrawer.module.css';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLocaleSwitcher: () => void;
  onOpenShare?: (() => void) | undefined;
  currentLocale: string;
}

function getFlagCode(locale: string): string {
  if (locale === 'es') return 'es';
  if (locale === 'pt-BR') return 'br';
  return 'us';
}

export function MenuDrawer({
  isOpen,
  onClose,
  onOpenLocaleSwitcher,
  onOpenShare,
  currentLocale
}: MenuDrawerProps) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIsMounted(true);
      setIsClosing(false);
      return undefined;
    }

    if (!isMounted) {
      return undefined;
    }

    setIsClosing(true);

    const timer = window.setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
    }, 180);

    return function cleanupClosingTimer() {
      window.clearTimeout(timer);
    };
  }, [isOpen, isMounted]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const panel = closeButtonRef.current?.closest('[role="dialog"]');
        if (!panel) {
          return;
        }

        const focusableElements = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return function cleanupKeyDownListener() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || isMounted) {
      return;
    }

    triggerRef.current?.focus();
  }, [isOpen, isMounted]);

  const handleOpenLocale = useCallback(() => {
    triggerRef.current = null;
    onClose();
    onOpenLocaleSwitcher();
  }, [onClose, onOpenLocaleSwitcher]);

  const handleOpenShare = useCallback(() => {
    if (!onOpenShare) {
      return;
    }

    triggerRef.current = null;
    onClose();
    onOpenShare();
  }, [onClose, onOpenShare]);

  if (!isMounted && !isOpen) {
    return null;
  }

  return createPortal(
    <div className={`${styles.overlay} ${!isClosing ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={t('drawer.close')}
      />

      <aside
        className={`${styles.panel} ${!isClosing ? styles.panelOpen : styles.panelClosing}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-drawer-title"
      >
        <div className={styles.header}>
          <Menu size={22} className={styles.menuIcon} aria-hidden="true" />
          <span id="menu-drawer-title" className={styles.title}>
            {t('home.header.title')}
          </span>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('drawer.close')}
            ref={closeButtonRef}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.menuList}>
          <button
            type="button"
            className={styles.row}
            disabled={!onOpenShare}
            onClick={handleOpenShare}
          >
            <Share2 size={22} aria-hidden="true" />
            <span className={styles.rowLabel}>{t('drawer.share')}</span>
          </button>

          <div className={styles.divider} aria-hidden="true" />

          <button
            type="button"
            className={styles.row}
            onClick={handleOpenLocale}
            aria-label={t('drawer.language')}
          >
            <span
              className={`fi fi-${getFlagCode(currentLocale)} ${styles.flag}`}
              aria-hidden="true"
            />
            <span className={styles.rowLabel}>{t('drawer.language')}</span>
            <span className={styles.localeMeta}>{t(`locale.${currentLocale}`)}</span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <div className={styles.divider} aria-hidden="true" />
        </div>

        <div className={styles.footer}>
          <span className={styles.version}>v{APP_VERSION}</span>
        </div>
      </aside>
    </div>,
    document.body
  );
}

import {
  Camera,
  ChevronRight,
  Download,
  ListMinus,
  Menu,
  Palette,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { FEATURE_FLAGS } from '@/config/features';
import { APP_VERSION } from '@/version';
import { usePwa } from '@/providers/PwaProvider';

import styles from './MenuDrawer.module.css';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLocaleSwitcher: () => void;
  onOpenThemeSwitcher?: () => void;
  onOpenDeleteConfirm?: () => void;
  onOpenShare?: (() => void) | undefined;
  onOpenMissing?: (() => void) | undefined;
  onOpenBackupRestore?: (() => void) | undefined;
  onOpenScanner?: (() => void) | undefined;
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
  onOpenThemeSwitcher,
  onOpenDeleteConfirm,
  onOpenShare,
  onOpenMissing,
  onOpenBackupRestore,
  onOpenScanner,
  currentLocale
}: MenuDrawerProps) {
  const { t } = useTranslation();
  const { installPlatform, canPromptInstall, promptInstall, openInstallSheet } = usePwa();
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
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  const handleOpenMissing = useCallback(() => {
    if (!onOpenMissing) {
      return;
    }

    triggerRef.current = null;
    onClose();
    onOpenMissing();
  }, [onClose, onOpenMissing]);

  const handleOpenDeleteConfirm = useCallback(() => {
    if (!onOpenDeleteConfirm) {
      return;
    }

    triggerRef.current = null;
    onClose();
    onOpenDeleteConfirm();
  }, [onClose, onOpenDeleteConfirm]);

  const handleOpenBackupRestore = useCallback(() => {
    if (!onOpenBackupRestore) {
      return;
    }

    triggerRef.current = null;
    onClose();
    onOpenBackupRestore();
  }, [onClose, onOpenBackupRestore]);

  const handleOpenScanner = useCallback(() => {
    if (!onOpenScanner) {
      return;
    }

    triggerRef.current = null;
    onClose();
    onOpenScanner();
  }, [onClose, onOpenScanner]);

  const handleOpenThemeSwitcher = useCallback(() => {
    if (!onOpenThemeSwitcher) {
      return;
    }

    triggerRef.current = null;
    onClose();
    onOpenThemeSwitcher();
  }, [onClose, onOpenThemeSwitcher]);

  const handleInstallClick = useCallback(() => {
    if (installPlatform === 'chromium') {
      onClose();
      void promptInstall();
      return;
    }

    if (installPlatform === 'ios') {
      triggerRef.current = null;
      onClose();
      openInstallSheet();
    }
  }, [installPlatform, onClose, openInstallSheet, promptInstall]);

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

      <div
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
            disabled={!onOpenMissing}
            onClick={handleOpenMissing}
          >
            <ListMinus size={22} aria-hidden="true" />
            <span className={styles.rowLabel}>{t('drawer.missing')}</span>
          </button>

          <div className={styles.divider} aria-hidden="true" />

          {FEATURE_FLAGS.scannerEnabled ? (
            <>
              <button
                type="button"
                className={styles.row}
                disabled={!onOpenScanner}
                onClick={handleOpenScanner}
              >
                <Camera size={22} aria-hidden="true" />
                <span className={styles.rowLabel}>{t('scanner.title')}</span>
              </button>

              <div className={styles.divider} aria-hidden="true" />
            </>
          ) : null}

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

          <button
            type="button"
            className={styles.row}
            onClick={handleOpenThemeSwitcher}
            disabled={!onOpenThemeSwitcher}
          >
            <Palette size={22} aria-hidden="true" />
            <span className={styles.rowLabel}>{t('drawer.theme')}</span>
          </button>

          <div className={styles.divider} aria-hidden="true" />

          <button
            type="button"
            className={styles.row}
            disabled={!onOpenBackupRestore}
            onClick={handleOpenBackupRestore}
          >
            <Download size={22} aria-hidden="true" />
            <span className={styles.rowLabel}>{t('drawer.backup_restore')}</span>
          </button>

          <div className={styles.divider} aria-hidden="true" />

          {installPlatform === 'ios' || (installPlatform === 'chromium' && canPromptInstall) ? (
            <>
              <button type="button" className={styles.row} onClick={handleInstallClick}>
                <Download size={22} aria-hidden="true" />
                <span className={styles.rowLabel}>{t('pwa.install.menuLabel')}</span>
                <span className={styles.localeMeta}>
                  {installPlatform === 'ios'
                    ? t('pwa.install.menuMetaIos')
                    : t('pwa.install.menuMetaChromium')}
                </span>
              </button>

              <div className={styles.divider} aria-hidden="true" />
            </>
          ) : null}

          <button
            type="button"
            className={styles.row}
            onClick={handleOpenDeleteConfirm}
            disabled={!onOpenDeleteConfirm}
          >
            <Trash2 size={22} aria-hidden="true" />
            <span className={styles.rowLabel}>{t('drawer.delete_data')}</span>
          </button>

          <div className={styles.divider} aria-hidden="true" />
        </div>

        <div className={styles.footer}>
          <span className={styles.version}>v{APP_VERSION}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

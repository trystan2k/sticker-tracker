/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import { CheckCircle2, CircleAlert } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import styles from './ScanResultPopup.module.css';

type ScanResultPopupProps = Readonly<{
  isOpen: boolean;
  stickerNumber: string;
  hasSticker: boolean;
  onClose: () => void;
}>;

export function ScanResultPopup({
  isOpen,
  stickerNumber,
  hasSticker,
  onClose
}: ScanResultPopupProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const statusLabel = hasSticker
    ? t('scanner.popup.alreadyHave', { defaultValue: 'Already have' })
    : t('scanner.popup.missing', { defaultValue: 'Missing!' });

  const statusClassName = hasSticker ? styles.statusHave : styles.statusMissing;

  const Icon = useMemo(() => (hasSticker ? CheckCircle2 : CircleAlert), [hasSticker]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const dialogNode = dialogRef.current;

    if (dialogNode) {
      const focusables = dialogNode.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusables[0]?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      const node = dialogRef.current;

      if (!node) {
        return;
      }

      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement;
      const current = activeElement instanceof HTMLElement ? activeElement : null;

      if (event.shiftKey) {
        if (current === first || !node.contains(current)) {
          event.preventDefault();
          last?.focus();
        }
      } else if (current === last || !node.contains(current)) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return function cleanupKeyDown() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <div className={styles.backdrop} aria-hidden="true" />

      <div
        ref={dialogRef}
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-label={t('scanner.popup.title', { defaultValue: 'Scan result' })}
      >
        <p className={styles.stickerNumberLabel}>
          {t('scanner.popup.stickerNumber', {
            defaultValue: 'Sticker {{stickerNumber}}',
            stickerNumber
          })}
        </p>

        <div className={`${styles.statusRow} ${statusClassName}`}>
          <Icon size={20} aria-hidden="true" />
          <span className={styles.statusText}>{statusLabel}</span>
        </div>

        <button type="button" className={styles.okButton} onClick={onClose}>
          {t('scanner.popup.ok', { defaultValue: 'OK' })}
        </button>
      </div>
    </div>,
    document.body
  );
}

import { Download, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { PersistedCollection } from '@/lib/storage/app-storage';
import {
  generateBackupPayload,
  triggerBackupDownload,
  triggerRestore
} from '@/services/backup-service';
import type { CollectionState, ReplaceCollectionResult } from '@/services/collection-service';
import type { SupportedLocale } from '@/services/locale-service';
import type { ThemeValue } from '@/services/theme-service';

import styles from './BackupRestoreSheet.module.css';

interface BackupRestoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionState;
  locale: string;
  theme: string;
  onRestoreCollection: (
    persistedCollection: PersistedCollection
  ) => Promise<ReplaceCollectionResult>;
  onRestoreLocale?: (locale: SupportedLocale) => Promise<void>;
  onRestoreTheme?: (theme: ThemeValue) => Promise<void>;
}

type BackupStatus =
  | 'idle'
  | 'exporting'
  | 'export-success'
  | 'export-error'
  | 'restoring'
  | 'restore-success'
  | 'restore-error';

function getStatusMessage(status: BackupStatus, t: (key: string) => string): string {
  if (status === 'exporting') {
    return t('backupRestore.exporting');
  }

  if (status === 'export-success') {
    return t('backupRestore.exportSuccess');
  }

  if (status === 'export-error') {
    return t('backupRestore.downloadError');
  }

  if (status === 'restoring') {
    return t('backupRestore.restoring');
  }

  if (status === 'restore-success') {
    return t('backupRestore.restoreSuccess');
  }

  if (status === 'restore-error') {
    return t('backupRestore.restoreWriteError');
  }

  return t('backupRestore.idle');
}

function hasCollectionData(collection: CollectionState): boolean {
  return Object.keys(collection).length > 0;
}

export function BackupRestoreSheet({
  isOpen,
  onClose,
  collection,
  locale,
  theme,
  onRestoreCollection,
  onRestoreLocale,
  onRestoreTheme
}: BackupRestoreSheetProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<BackupStatus>('idle');
  const [statusMessage, setStatusMessage] = useState(() => t('backupRestore.idle'));
  const lastSuccessRef = useRef<'backup' | 'restore' | null>(null);

  const isBusy = status === 'exporting' || status === 'restoring';

  useEffect(() => {
    setStatusMessage(getStatusMessage(status, t));
  }, [status, t]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return function cleanupKeyDownListener() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset to idle when sheet opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setStatusMessage(t('backupRestore.idle'));
      lastSuccessRef.current = null;
    }
  }, [isOpen, t]);

  const handleBackup = useCallback(async () => {
    setStatus('exporting');
    setStatusMessage(t('backupRestore.exporting'));

    try {
      const payload = generateBackupPayload(collection, locale, theme);
      const downloadResult = await triggerBackupDownload(payload);

      if (downloadResult.state === 'success') {
        onClose();
        return;
      }

      if (downloadResult.state === 'cancelled') {
        setStatus('idle');
        setStatusMessage(t('backupRestore.idle'));
        return;
      }

      setStatus('export-error');
      setStatusMessage(t('backupRestore.downloadError'));
    } catch {
      setStatus('export-error');
      setStatusMessage(t('backupRestore.downloadError'));
    }
  }, [collection, locale, onClose, t, theme]);

  const handleBackupClick = useCallback(() => {
    void handleBackup();
  }, [handleBackup]);

  const handleRestore = useCallback(async () => {
    setStatus('restoring');
    setStatusMessage(t('backupRestore.restoring'));

    const restoreReadResult = await triggerRestore();

    if (restoreReadResult.state === 'cancelled') {
      if (lastSuccessRef.current !== null) {
        setStatusMessage(
          lastSuccessRef.current === 'backup'
            ? t('backupRestore.exportSuccess')
            : t('backupRestore.restoreSuccess')
        );
        return;
      }

      setStatus('idle');
      setStatusMessage(t('backupRestore.idle'));
      return;
    }

    if (restoreReadResult.state === 'error') {
      setStatus('restore-error');

      if (restoreReadResult.code === 'invalid-json') {
        setStatusMessage(t('backupRestore.invalidJson'));
        return;
      }

      if (restoreReadResult.code === 'invalid-schema') {
        setStatusMessage(t('backupRestore.invalidSchema'));
        return;
      }

      if (restoreReadResult.code === 'unsupported-version') {
        setStatusMessage(t('backupRestore.unsupportedVersion'));
        return;
      }

      if (restoreReadResult.code === 'missing-collection') {
        setStatusMessage(t('backupRestore.missingCollection'));
        return;
      }

      if (restoreReadResult.code === 'invalid-collection') {
        setStatusMessage(t('backupRestore.invalidCollection'));
        return;
      }

      if (restoreReadResult.code === 'invalid-page-id') {
        setStatusMessage(
          t('backupRestore.invalidPageId', {
            pageId: restoreReadResult.metadata?.pageId ?? ''
          })
        );
        return;
      }

      if (restoreReadResult.code === 'invalid-sticker-id') {
        setStatusMessage(
          t('backupRestore.invalidStickerId', {
            pageId: restoreReadResult.metadata?.pageId ?? '',
            stickerId: restoreReadResult.metadata?.stickerId ?? ''
          })
        );
        return;
      }

      if (restoreReadResult.code === 'duplicate-sticker-id') {
        setStatusMessage(
          t('backupRestore.duplicateStickerId', {
            pageId: restoreReadResult.metadata?.pageId ?? ''
          })
        );
        return;
      }

      if (restoreReadResult.code === 'invalid-locale') {
        setStatusMessage(t('backupRestore.invalidLocale'));
        return;
      }

      if (restoreReadResult.code === 'invalid-theme') {
        setStatusMessage(t('backupRestore.invalidTheme'));
        return;
      }

      setStatusMessage(t('backupRestore.readError'));
      return;
    }

    if (hasCollectionData(collection)) {
      // oxlint-disable-next-line no-alert
      const isConfirmed = window.confirm(
        `${t('backupRestore.confirmTitle')}\n\n${t('backupRestore.confirmBody')}`
      );

      if (!isConfirmed) {
        setStatus('idle');
        setStatusMessage(t('backupRestore.idle'));
        return;
      }
    }

    const restoreWriteResult = await onRestoreCollection(restoreReadResult.collection);

    if (restoreWriteResult.state === 'ready') {
      if (restoreReadResult.locale && onRestoreLocale) {
        try {
          await onRestoreLocale(restoreReadResult.locale);
        } catch {
          // Ignore locale restore failure to preserve restored collection.
        }
      }

      if (restoreReadResult.theme && onRestoreTheme) {
        try {
          await onRestoreTheme(restoreReadResult.theme);
        } catch {
          // Ignore theme restore failure to preserve restored collection.
        }
      }

      onClose();
      return;
    }

    setStatus('restore-error');
    setStatusMessage(t('backupRestore.restoreWriteError'));
  }, [collection, onClose, onRestoreCollection, onRestoreLocale, onRestoreTheme, t]);

  const handleRestoreClick = useCallback(() => {
    void handleRestore();
  }, [handleRestore]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('backupRestore.sheetTitle')}
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={t('backupRestore.close')}
      />

      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <span className={styles.title}>{t('backupRestore.sheetTitle')}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('backupRestore.close')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.content}>
          <button
            type="button"
            className={styles.actionRow}
            onClick={handleBackupClick}
            disabled={isBusy}
          >
            <Download className={styles.actionIcon} aria-hidden="true" />
            <span className={styles.actionLabel}>{t('backupRestore.backup')}</span>
          </button>

          <button
            type="button"
            className={styles.actionRow}
            onClick={handleRestoreClick}
            disabled={isBusy}
          >
            <Upload className={styles.actionIcon} aria-hidden="true" />
            <span className={styles.actionLabel}>{t('backupRestore.restore')}</span>
          </button>

          <div className={styles.statusArea} role="status" aria-live="polite" aria-atomic="true">
            <p className={styles.statusText}>{statusMessage}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

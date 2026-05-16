import { Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { parseStickerNumber } from '@/services/scanner-parser';
import { buildScannerLookupIndex } from '@/services/scanner-lookup';

import styles from './ReviewModal.module.css';

type ReviewStickerItem = Readonly<{
  id: string;
  rawText: string;
  stickerNumber: string;
}>;

type ReviewModalProps = Readonly<{
  isOpen: boolean;
  items: readonly ReviewStickerItem[];
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
  onConfirm: (stickerIds: readonly string[]) => void | Promise<void>;
  onCancel: () => void;
}>;

type ValidationState = Readonly<{
  hasInvalidFormat: boolean;
  hasUnknownSticker: boolean;
  duplicateCount: number;
  validUniqueStickerIds: readonly string[];
}>;

function getValidationState(
  values: readonly string[],
  knownCodes: ReadonlySet<string>
): ValidationState {
  const canonicalCodes: string[] = [];
  let hasInvalidFormat = false;
  let hasUnknownSticker = false;

  for (const value of values) {
    const parsedSticker = parseStickerNumber(value);

    if (parsedSticker.state !== 'matched') {
      hasInvalidFormat = true;
      continue;
    }

    if (!knownCodes.has(parsedSticker.code)) {
      hasUnknownSticker = true;
      continue;
    }

    canonicalCodes.push(parsedSticker.code);
  }

  const uniqueCodes = [...new Set(canonicalCodes)];

  return {
    hasInvalidFormat,
    hasUnknownSticker,
    duplicateCount: canonicalCodes.length - uniqueCodes.length,
    validUniqueStickerIds: uniqueCodes
  };
}

type ReviewItemRowProps = Readonly<{
  item: ReviewStickerItem;
  errorMessage: string | null;
  onChange: (itemId: string, value: string) => void;
  onDelete: (itemId: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}>;

function ReviewItemRow({ item, errorMessage, onChange, onDelete, t }: ReviewItemRowProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(item.id, event.currentTarget.value);
    },
    [item.id, onChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const hasError = errorMessage !== null;

  return (
    <li className={styles.itemRow}>
      <label className={styles.inputLabel}>
        <span className={styles.inputLabelText}>
          {t('scanner.review.stickerLabel', { defaultValue: 'Sticker code' })}
        </span>

        <input
          type="text"
          value={item.stickerNumber}
          onChange={handleChange}
          className={hasError ? `${styles.input} ${styles.inputInvalid}` : styles.input}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${item.id}-raw ${item.id}-error` : `${item.id}-raw`}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>

      <p id={`${item.id}-raw`} className={styles.rawText}>
        {t('scanner.review.rawText', {
          defaultValue: 'OCR read: {{text}}',
          text: item.rawText
        })}
      </p>

      {hasError ? (
        <p id={`${item.id}-error`} className={styles.errorText}>
          {errorMessage}
        </p>
      ) : null}

      <button type="button" className={styles.deleteButton} onClick={handleDelete}>
        <Trash2 size={16} aria-hidden="true" />
        <span>{t('scanner.review.delete', { defaultValue: 'Delete' })}</span>
      </button>
    </li>
  );
}

export function ReviewModal({
  isOpen,
  items,
  isSubmitting = false,
  submitErrorMessage,
  onConfirm,
  onCancel
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [draftItems, setDraftItems] = useState<readonly ReviewStickerItem[]>(items);
  const knownStickerCodes = useMemo(() => {
    return new Set(Object.keys(buildScannerLookupIndex().entries));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftItems(items);
  }, [isOpen, items]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);

    return function cleanupKeyDown() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  const handleChangeStickerNumber = useCallback((itemId: string, value: string) => {
    setDraftItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, stickerNumber: value } : item))
    );
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    setDraftItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }, []);

  const values = useMemo(() => draftItems.map((item) => item.stickerNumber.trim()), [draftItems]);

  const validationState = useMemo(
    () => getValidationState(values, knownStickerCodes),
    [knownStickerCodes, values]
  );

  const canConfirm =
    !isSubmitting &&
    !validationState.hasInvalidFormat &&
    !validationState.hasUnknownSticker &&
    validationState.validUniqueStickerIds.length > 0;

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) {
      return;
    }

    await onConfirm(validationState.validUniqueStickerIds);
  }, [canConfirm, onConfirm, validationState.validUniqueStickerIds]);

  const handleConfirmClick = useCallback(() => {
    void handleConfirm();
  }, [handleConfirm]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      data-testid="scanner-review-modal"
      aria-label={t('scanner.review.title', { defaultValue: 'Review scanned stickers' })}
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={onCancel}
        aria-label={t('scanner.review.close', { defaultValue: 'Close review modal' })}
      />

      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            {t('scanner.review.title', { defaultValue: 'Review scanned stickers' })}
          </h2>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onCancel}
            aria-label={t('scanner.review.close', { defaultValue: 'Close review modal' })}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <p className={styles.description}>
          {t('scanner.review.description', {
            defaultValue: 'Fix OCR errors, remove items, then confirm collected stickers.'
          })}
        </p>

        <ul className={styles.items}>
          {draftItems.map((item) => {
            const parsedSticker = parseStickerNumber(item.stickerNumber.trim());
            const rowErrorMessage =
              parsedSticker.state !== 'matched'
                ? t('scanner.review.invalidFormat', {
                    defaultValue: 'Invalid format. Use code like BRA-12, 00 or CC1.'
                  })
                : !knownStickerCodes.has(parsedSticker.code)
                  ? t('scanner.review.unknownSticker', {
                      defaultValue: 'Sticker code not found in album.'
                    })
                  : null;

            return (
              <ReviewItemRow
                key={item.id}
                item={item}
                errorMessage={rowErrorMessage}
                onChange={handleChangeStickerNumber}
                onDelete={handleDeleteItem}
                t={t}
              />
            );
          })}
        </ul>

        {validationState.duplicateCount > 0 ? (
          <p className={styles.helperText}>
            {t('scanner.review.duplicatesFiltered', {
              defaultValue:
                'Duplicate sticker codes detected. {{count}} duplicate(s) will be ignored on confirm.',
              count: validationState.duplicateCount
            })}
          </p>
        ) : null}

        {draftItems.length === 0 ? (
          <p className={styles.helperText}>
            {t('scanner.review.empty', {
              defaultValue: 'No stickers left in this session. Cancel to discard session.'
            })}
          </p>
        ) : null}

        {submitErrorMessage ? <p className={styles.errorText}>{submitErrorMessage}</p> : null}

        <footer className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            {t('scanner.review.cancel', { defaultValue: 'Cancel session' })}
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleConfirmClick}
            disabled={!canConfirm}
          >
            {isSubmitting
              ? t('scanner.review.confirming', { defaultValue: 'Confirming...' })
              : t('scanner.review.confirm', { defaultValue: 'Confirm as collected' })}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

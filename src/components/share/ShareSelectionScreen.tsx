import { ArrowLeft } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getShareModeKeyPrefix, type ShareMode } from '@/components/share/share-mode';
import type { ShareSelectionSection } from '@/components/share/share-state';
import type { PageId } from '@/data/album';

import styles from './ShareSelectionScreen.module.css';

type ShareSelectionScreenProps = Readonly<{
  sections: readonly ShareSelectionSection[];
  selectedPageIds: readonly PageId[];
  onBack: () => void;
  onTogglePage: (pageId: PageId) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onGenerate: (selectedPageIds: readonly PageId[]) => void;
  mode?: ShareMode;
}>;

export function ShareSelectionScreen({
  sections,
  selectedPageIds,
  onBack,
  onTogglePage,
  onSelectAll,
  onClear,
  onGenerate,
  mode = 'missing'
}: ShareSelectionScreenProps) {
  const { t } = useTranslation();
  const translationKeyPrefix = getShareModeKeyPrefix(mode);
  const selectedSet = useMemo(() => new Set(selectedPageIds), [selectedPageIds]);
  const selectableRows = useMemo(
    () => sections.flatMap((section) => section.rows).filter((row) => row.stickerCount > 0),
    [sections]
  );
  const selectableIds = useMemo(
    () => new Set(selectableRows.map((row) => row.pageId)),
    [selectableRows]
  );
  const validSelectedIds = useMemo(
    () => selectedPageIds.filter((pageId) => selectableIds.has(pageId)),
    [selectedPageIds, selectableIds]
  );
  const selectedCount = validSelectedIds.length;
  const isEmpty = selectableRows.length === 0;

  const handleTogglePage = useCallback(
    (pageId: PageId) => () => {
      onTogglePage(pageId);
    },
    [onTogglePage]
  );

  const handleGenerate = useCallback(() => {
    onGenerate(validSelectedIds);
  }, [onGenerate, validSelectedIds]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onBack}
          aria-label={t(`${translationKeyPrefix}.selection.back`)}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t(`${translationKeyPrefix}.selection.title`)}</h1>
      </header>

      <section
        className={styles.actionsRow}
        aria-label={t(`${translationKeyPrefix}.selection.title`)}
      >
        <div className={styles.actionsLeft}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={onSelectAll}
            disabled={isEmpty}
          >
            {t(`${translationKeyPrefix}.selection.selectAll`)}
          </button>
          <button
            type="button"
            className={styles.linkButton}
            onClick={onClear}
            disabled={selectedCount === 0}
          >
            {t(`${translationKeyPrefix}.selection.clear`)}
          </button>
        </div>

        <span className={styles.selectedPill}>
          {t(`${translationKeyPrefix}.selection.selected`, { count: selectedCount })}
        </span>
      </section>

      <div className={styles.listArea}>
        {isEmpty ? (
          <p className={styles.emptyState}>{t(`${translationKeyPrefix}.selection.empty`)}</p>
        ) : (
          sections.map((section) => {
            const visibleRows = section.rows.filter((row) => row.stickerCount > 0);

            if (visibleRows.length === 0) {
              return null;
            }

            return (
              <section key={section.sectionId} className={styles.section}>
                <h2 className={styles.sectionTitle}>{t(section.sectionLabel)}</h2>
                <ul className={styles.rows}>
                  {visibleRows.map((row) => {
                    const isChecked = selectedSet.has(row.pageId);
                    const rowTitle = t(row.title);
                    const metaLabel =
                      row.pageType === 'team' && row.group
                        ? t(`group.${row.group.toLowerCase()}`)
                        : row.specialKey
                          ? t(`album.specialSection.${row.specialKey}`)
                          : '';

                    return (
                      <li key={row.pageId}>
                        <label className={styles.row}>
                          {row.pageType === 'team' ? (
                            <span
                              className={`fi fi-${row.flagCode} ${styles.flag}`}
                              aria-hidden="true"
                            />
                          ) : row.specialKey === 'fwc-opening' ||
                            row.specialKey === 'fwc-closing' ? (
                            <img
                              src="/images/fifa.png"
                              alt=""
                              className={styles.flag}
                              aria-hidden="true"
                            />
                          ) : row.specialKey === 'coca-cola' ? (
                            <img
                              src="/images/cocacola.png"
                              alt=""
                              className={styles.flag}
                              aria-hidden="true"
                            />
                          ) : (
                            <span className={styles.specialMark} aria-hidden="true" />
                          )}

                          <span className={styles.pageInfo}>
                            <span className={styles.pageTitle}>{rowTitle}</span>
                            <span className={styles.pageMeta}>{metaLabel}</span>
                          </span>

                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={isChecked}
                            onChange={handleTogglePage(row.pageId)}
                            aria-label={rowTitle}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.generateButton}
          disabled={selectedCount === 0 || isEmpty}
          onClick={handleGenerate}
        >
          {t(`${translationKeyPrefix}.selection.generate`)}
        </button>
      </footer>
    </div>
  );
}

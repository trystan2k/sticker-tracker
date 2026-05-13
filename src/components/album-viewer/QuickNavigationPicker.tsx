import { useNavigate } from '@tanstack/react-router';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { AlbumPage, PageId } from '@/data/album';

import { getAlbumPath, isValidPageId, PAGE_SECTION_RUNS } from './viewer-state';
import styles from './QuickNavigationPicker.module.css';

type QuickNavigationPickerProps = Readonly<{
  isOpen: boolean;
  activePageId: PageId;
  onClose: () => void;
}>;

type PickerEntry = Readonly<{
  page: AlbumPage;
  sectionId: string;
  title: string;
  subtitle: string;
}>;

export function QuickNavigationPicker({
  isOpen,
  activePageId,
  onClose
}: QuickNavigationPickerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const entries = useMemo<readonly PickerEntry[]>(() => {
    return PAGE_SECTION_RUNS.flatMap((run) => {
      return run.pages.map((page) => {
        if (page.type === 'team') {
          return {
            page,
            sectionId: run.sectionId,
            title: t(page.translationKey),
            subtitle: t(`group.${page.group.toLowerCase()}`)
          };
        }

        return {
          page,
          sectionId: run.sectionId,
          title: t(page.translationKey),
          subtitle: t(`album.specialSection.${page.key}`)
        };
      });
    });
  }, [t]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter(
      (entry) =>
        entry.title.toLocaleLowerCase().includes(normalizedQuery) ||
        entry.subtitle.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [entries, query]);

  const entriesBySection = useMemo(() => {
    const sectionMap = new Map<string, PickerEntry[]>();
    for (const entry of filteredEntries) {
      const current = sectionMap.get(entry.sectionId);
      if (current) {
        current.push(entry);
      } else {
        sectionMap.set(entry.sectionId, [entry]);
      }
    }

    return sectionMap;
  }, [filteredEntries]);

  const sections = useMemo(
    () =>
      Array.from(entriesBySection.entries()).map(([sectionId, sectionEntries]) => ({
        sectionId,
        label: t(`album.quickNavigation.sections.${sectionId}`),
        entries: sectionEntries
      })),
    [entriesBySection, t]
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
  }, []);

  const handleRowClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rawId = event.currentTarget.dataset.pageId;
      if (!rawId || !isValidPageId(rawId)) {
        return;
      }

      const page = PAGE_SECTION_RUNS.flatMap((run) => run.pages).find(
        (entry) => entry.pageId === rawId
      );
      if (!page) {
        return;
      }

      const path = getAlbumPath(page);

      // Apply view transition for smooth navigation
      if (typeof document !== 'undefined' && document.startViewTransition) {
        const html = document.documentElement;
        html.classList.add('nav-forward');
        const transition = document.startViewTransition(() => {
          flushSync(() => {
            void navigate({ to: path });
          });
        });
        void transition.finished.finally(() => {
          html.classList.remove('nav-forward', 'nav-back');
        });
      } else {
        void navigate({ to: path });
      }

      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    // Capture the element that had focus before the picker opened
    const previouslyFocused = document.activeElement;
    if (previouslyFocused instanceof HTMLElement) {
      triggerRef.current = previouslyFocused;
    }

    setQuery('');

    // Focus search input when picker opens
    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Minimal focus trap: constrain Tab/Shift+Tab within the sheet
      if (event.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) return;

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return function cleanupPickerEffects() {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger element on close
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-nav-title"
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={t('album.quickNavigation.close')}
      />

      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.dragHandleRow}>
          <span className={styles.dragHandle} aria-hidden="true" />
        </div>

        <div className={styles.sheetHeader}>
          <h2 id="quick-nav-title" className={styles.title}>
            {t('album.quickNavigation.title')}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('album.quickNavigation.close')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} aria-hidden="true" className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="search"
            className={styles.searchInput}
            placeholder={t('album.quickNavigation.searchPlaceholder')}
            value={query}
            onChange={handleSearchChange}
            aria-label={t('album.quickNavigation.searchAriaLabel')}
          />
        </div>

        <div className={styles.teamList}>
          {sections.map((section) => (
            <section key={section.sectionId} className={styles.section}>
              <h3 className={styles.sectionHeader}>{section.label}</h3>
              <div className={styles.sectionList}>
                {section.entries.map((entry) => {
                  const isActive = entry.page.pageId === activePageId;

                  return (
                    <button
                      key={entry.page.pageId}
                      type="button"
                      className={styles.teamRow}
                      data-page-id={entry.page.pageId}
                      onClick={handleRowClick}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {entry.page.type === 'team' ? (
                        <span
                          className={`fi fi-${entry.page.flagCode} ${styles.flag}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className={styles.specialDot} aria-hidden="true" />
                      )}
                      <span className={styles.rowTitle}>{entry.title}</span>
                      <span className={styles.rowSubtitle}>{entry.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

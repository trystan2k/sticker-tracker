/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import { ArrowLeft, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { albumPages, type PageId, type StickerIdentifier } from '@/data/album';
import { StickerCell } from '@/components/album-viewer/StickerCell';
import { getStickerInteractionKey } from '@/components/album-viewer/sticker-cell-interactions';
import type { CollectionState, ToggleStickerResult } from '@/services/collection-service';

import { buildMissingState } from './missing-state';
import styles from './MissingScreen.module.css';

type MissingScreenProps = Readonly<{
  collection: CollectionState;
  onBack: () => void;
  onShare: () => void;
  onToggleCollected: (pageId: PageId, stickerId: StickerIdentifier) => Promise<ToggleStickerResult>;
}>;

type FocusTarget =
  | { kind: 'sticker'; interactionKey: string }
  | { kind: 'empty-state' }
  | { kind: 'back' };

const PAGE_BY_ID = new Map(albumPages.map((page) => [page.pageId, page]));

function getPageDisplayTitle(
  page: (typeof albumPages)[number],
  t: ReturnType<typeof useTranslation>['t']
) {
  if (page.type === 'special' && (page.key === 'fwc-opening' || page.key === 'fwc-closing')) {
    return t('missing.block.fwcCode');
  }

  return t(page.translationKey);
}

function getNextFocusTarget(
  state: ReturnType<typeof buildMissingState>,
  pageId: PageId,
  stickerId: StickerIdentifier
): FocusTarget {
  if (state.kind !== 'ready') {
    return { kind: 'back' };
  }

  const currentPageIndex = state.pages.findIndex((page) => page.pageId === pageId);

  if (currentPageIndex < 0) {
    return { kind: 'back' };
  }

  const currentPage = state.pages[currentPageIndex];

  if (!currentPage) {
    return { kind: 'back' };
  }

  const currentStickerIndex = currentPage.missingStickerIds.findIndex((id) => id === stickerId);

  if (currentStickerIndex >= 0) {
    const nextInSameBlock = currentPage.missingStickerIds[currentStickerIndex + 1];

    if (nextInSameBlock) {
      return { kind: 'sticker', interactionKey: getStickerInteractionKey(pageId, nextInSameBlock) };
    }
  }

  const nextPage = state.pages[currentPageIndex + 1];

  if (nextPage?.missingStickerIds[0]) {
    return {
      kind: 'sticker',
      interactionKey: getStickerInteractionKey(nextPage.pageId, nextPage.missingStickerIds[0])
    };
  }

  return state.pages.length === 1 ? { kind: 'empty-state' } : { kind: 'back' };
}

export function MissingScreen({
  collection,
  onBack,
  onShare,
  onToggleCollected
}: MissingScreenProps) {
  const { t, i18n } = useTranslation();
  const [hiddenStickerIds, setHiddenStickerIds] = useState<ReadonlySet<StickerIdentifier>>(
    new Set()
  );
  const [pendingStickerIds, setPendingStickerIds] = useState<ReadonlySet<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const emptyStateRef = useRef<HTMLButtonElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());

  const baseState = useMemo(() => buildMissingState(collection), [collection]);
  const state = useMemo(
    () => buildMissingState(collection, { hiddenStickerIds }),
    [collection, hiddenStickerIds]
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

  useEffect(() => {
    if (!showToast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setShowToast(false);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [showToast]);

  useEffect(() => {
    const currentlyMissing = new Set<StickerIdentifier>();
    const currentInteractionKeys = new Set<string>();

    if (baseState.kind === 'ready') {
      for (const page of baseState.pages) {
        for (const stickerId of page.missingStickerIds) {
          currentlyMissing.add(stickerId);
          currentInteractionKeys.add(getStickerInteractionKey(page.pageId, stickerId));
        }
      }
    }

    setHiddenStickerIds((current) => {
      const next = new Set(
        Array.from(current).filter((stickerId) => currentlyMissing.has(stickerId))
      );

      return next.size === current.size ? current : next;
    });

    setPendingStickerIds((current) => {
      const next = new Set(
        Array.from(current).filter((interactionKey) => currentInteractionKeys.has(interactionKey))
      );
      pendingRef.current = next;

      return next.size === current.size ? current : next;
    });
  }, [baseState]);

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    if (focusTarget.kind === 'sticker') {
      const target = screenRef.current?.querySelector<HTMLElement>(
        `[data-testid="${focusTarget.interactionKey}"]`
      );

      if (target) {
        target.focus();
        setFocusTarget(null);
        return;
      }
    }

    if (focusTarget.kind === 'empty-state') {
      if (emptyStateRef.current) {
        emptyStateRef.current.focus();
        setFocusTarget(null);
        return;
      }
    }

    if (backButtonRef.current) {
      backButtonRef.current.focus();
      setFocusTarget(null);
    }
  }, [focusTarget, state.kind]);

  const handleCollectSticker = useCallback(
    async (pageId: PageId, stickerId: StickerIdentifier): Promise<void> => {
      const interactionKey = getStickerInteractionKey(pageId, stickerId);

      if (pendingRef.current.has(interactionKey)) {
        return;
      }

      const rollbackOptimisticState = () => {
        setPendingStickerIds((current) => {
          const next = new Set(current);
          next.delete(interactionKey);
          return next;
        });

        setHiddenStickerIds((current) => {
          const next = new Set(current);
          next.delete(stickerId);
          return next;
        });
      };

      pendingRef.current.add(interactionKey);
      setFocusTarget(getNextFocusTarget(state, pageId, stickerId));

      setPendingStickerIds((current) => new Set(current).add(interactionKey));
      setHiddenStickerIds((current) => new Set(current).add(stickerId));

      try {
        const result = await onToggleCollected(pageId, stickerId);

        if (result.state !== 'ready') {
          rollbackOptimisticState();
          return;
        }

        setShowToast(true);
      } catch {
        rollbackOptimisticState();
      } finally {
        pendingRef.current.delete(interactionKey);
      }
    },
    [onToggleCollected, state]
  );

  return (
    <div ref={screenRef} className={styles.screen}>
      <header className={styles.header}>
        <button
          ref={backButtonRef}
          type="button"
          className={styles.iconButton}
          onClick={onBack}
          aria-label={t('missing.header.back')}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t('missing.header.title')}</h1>
        {state.kind === 'ready' ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onShare}
            aria-label={t('missing.header.share')}
          >
            <Share2 size={20} aria-hidden="true" />
          </button>
        ) : (
          <span className={styles.headerSpacer} aria-hidden="true" />
        )}
      </header>

      <section className={styles.progressSection} aria-label={t('missing.summary.ariaLabel')}>
        <div className={styles.progressLabelRow}>
          <p className={styles.summaryLabel}>
            {t('missing.summary.collected', {
              collected: numberFormatter.format(state.collectedCount),
              total: numberFormatter.format(state.albumTotal)
            })}
          </p>
          <p className={styles.summaryValue}>
            {t('missing.summary.totalMissing', {
              count: numberFormatter.format(state.totalMissingCount)
            })}
          </p>
        </div>
        <progress
          className={styles.progressTrack}
          value={state.collectedCount}
          max={state.albumTotal}
          aria-label={t('missing.summary.progressAriaLabel')}
        />
      </section>

      <section className={styles.content} aria-label={t('missing.content.ariaLabel')}>
        <section className={styles.intro}>
          <h2 className={styles.introTitle}>{t('missing.intro.title')}</h2>
          <p className={styles.introDescription}>{t('missing.intro.description')}</p>
        </section>

        {state.kind === 'all-complete' ? (
          <section className={styles.emptyState} aria-live="polite">
            <h2 className={styles.emptyTitle}>{t('missing.empty.title')}</h2>
            <p className={styles.emptyDescription}>{t('missing.empty.description')}</p>
            <button
              ref={emptyStateRef}
              type="button"
              className={styles.emptyBackButton}
              onClick={onBack}
            >
              {t('missing.empty.backHome')}
            </button>
          </section>
        ) : (
          <div className={styles.blocks}>
            {state.pages.map((pageBlock) => {
              const page = PAGE_BY_ID.get(pageBlock.pageId);

              if (!page) {
                return null;
              }

              const blockTitle = getPageDisplayTitle(page, t);
              const blockMeta =
                page.type === 'team'
                  ? t(`group.${page.group.toLowerCase()}`)
                  : t('missing.block.specialLabel');
              const specialIconSrc =
                page.type === 'special'
                  ? page.key === 'coca-cola'
                    ? '/images/cocacola.png'
                    : '/images/fifa.png'
                  : null;

              return (
                <section key={pageBlock.pageId} className={styles.block}>
                  <header className={styles.blockHeader}>
                    {page.type === 'team' ? (
                      <span
                        className={`fi fi-${page.flagCode} ${styles.blockFlag}`}
                        aria-hidden="true"
                      />
                    ) : specialIconSrc ? (
                      <img
                        src={specialIconSrc}
                        alt=""
                        className={styles.blockFlag}
                        aria-hidden="true"
                      />
                    ) : null}

                    <div className={styles.blockText}>
                      <div className={styles.blockTitleRow}>
                        <h2 className={styles.blockTitle}>{blockTitle}</h2>
                        <span className={styles.blockDivider} aria-hidden="true">
                          ·
                        </span>
                        <span className={styles.blockBadge}>{blockMeta}</span>
                      </div>
                    </div>

                    <span
                      className={styles.blockCount}
                      aria-label={t('missing.block.missingCount', {
                        count: numberFormatter.format(pageBlock.missingCount)
                      })}
                    >
                      {numberFormatter.format(pageBlock.missingCount)}/
                      {numberFormatter.format(pageBlock.totalCount)}
                    </span>
                  </header>

                  <div className={styles.grid}>
                    {pageBlock.missingStickerIds.map((stickerId) => (
                      <MissingStickerButton
                        key={stickerId}
                        page={page}
                        stickerId={stickerId}
                        isPending={pendingStickerIds.has(
                          getStickerInteractionKey(page.pageId, stickerId)
                        )}
                        onCollect={handleCollectSticker}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <div className={styles.safeArea} aria-hidden="true">
          <span className={styles.homeIndicator} />
        </div>
        {showToast ? (
          <p className={styles.toast} role="status" aria-live="polite" aria-atomic="true">
            {t('scanner.review.success')}
          </p>
        ) : null}
      </footer>
    </div>
  );
}

type MissingStickerButtonProps = Readonly<{
  page: (typeof albumPages)[number];
  stickerId: StickerIdentifier;
  isPending: boolean;
  onCollect: (pageId: PageId, stickerId: StickerIdentifier) => Promise<void>;
}>;

function MissingStickerButton({
  page,
  stickerId,
  isPending,
  onCollect
}: MissingStickerButtonProps) {
  const handleSetStickerQuantity = useCallback(() => {
    void onCollect(page.pageId, stickerId);
  }, [onCollect, page.pageId, stickerId]);

  return (
    <StickerCell
      dataTestId={getStickerInteractionKey(page.pageId, stickerId)}
      page={page}
      stickerId={stickerId}
      quantity={0}
      onSetStickerQuantity={handleSetStickerQuantity}
      disabled={isPending}
    />
  );
}

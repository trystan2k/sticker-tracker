import { ArrowLeft, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StickerCell } from '@/components/album-viewer/StickerCell';
import { getStickerInteractionKey } from '@/components/album-viewer/sticker-cell-interactions';
import { albumPages, type PageId, type StickerIdentifier } from '@/data/album';
import {
  getStickerQuantity,
  type CollectionState,
  type UpdateStickerQuantityResult
} from '@/services/collection-service';

import type { RepeatedState } from './repeated-state';
import styles from './RepeatedScreen.module.css';

export type RepeatedScreenProps = Readonly<{
  collection: CollectionState;
  state: RepeatedState;
  onBack: () => void;
  onShare?: () => void;
  onSetStickerQuantity: (
    pageId: PageId,
    stickerId: StickerIdentifier,
    quantity: number
  ) => Promise<UpdateStickerQuantityResult>;
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
    return t('repeated.block.fwcCode');
  }

  return t(page.translationKey);
}

function getPageMetaLabel(
  page: (typeof albumPages)[number],
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (page.type === 'team') {
    return t(`group.${page.group.toLowerCase()}`);
  }

  if (page.key === 'fwc-opening' || page.key === 'fwc-closing') {
    return t(page.translationKey);
  }

  return t('repeated.block.specialLabel');
}

function getSpecialIconSrc(page: (typeof albumPages)[number]): string | null {
  if (page.type !== 'special') {
    return null;
  }

  return page.key === 'coca-cola' ? '/images/cocacola.png' : '/images/fifa.png';
}

function getNextFocusTarget(
  state: RepeatedState,
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

  const currentStickerIndex = currentPage.repeatedStickerIds.findIndex((id) => id === stickerId);

  if (currentStickerIndex >= 0) {
    const nextInSameBlock = currentPage.repeatedStickerIds[currentStickerIndex + 1];

    if (nextInSameBlock) {
      return { kind: 'sticker', interactionKey: getStickerInteractionKey(pageId, nextInSameBlock) };
    }

    const previousInSameBlock = currentPage.repeatedStickerIds[currentStickerIndex - 1];

    if (previousInSameBlock) {
      return {
        kind: 'sticker',
        interactionKey: getStickerInteractionKey(pageId, previousInSameBlock)
      };
    }
  }

  const nextPage = state.pages[currentPageIndex + 1];

  if (nextPage?.repeatedStickerIds[0]) {
    return {
      kind: 'sticker',
      interactionKey: getStickerInteractionKey(nextPage.pageId, nextPage.repeatedStickerIds[0])
    };
  }

  for (let pageIndex = currentPageIndex - 1; pageIndex >= 0; pageIndex -= 1) {
    const previousPage = state.pages[pageIndex];
    const previousPageLastStickerId = previousPage?.repeatedStickerIds.at(-1);

    if (previousPage && previousPageLastStickerId) {
      return {
        kind: 'sticker',
        interactionKey: getStickerInteractionKey(previousPage.pageId, previousPageLastStickerId)
      };
    }
  }

  return state.pages.length === 1 ? { kind: 'empty-state' } : { kind: 'back' };
}

export function RepeatedScreen({
  collection,
  state,
  onBack,
  onShare,
  onSetStickerQuantity
}: RepeatedScreenProps) {
  const { t, i18n } = useTranslation();
  const [pendingStickerIds, setPendingStickerIds] = useState<ReadonlySet<string>>(new Set());
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const emptyStateRef = useRef<HTMLButtonElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

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
  }, [focusTarget, state.kind, state]);

  const handleSetStickerQuantity = useCallback(
    async (pageId: PageId, stickerId: StickerIdentifier, quantity: number): Promise<void> => {
      const interactionKey = getStickerInteractionKey(pageId, stickerId);

      if (pendingRef.current.has(interactionKey)) {
        return;
      }

      pendingRef.current.add(interactionKey);
      setPendingStickerIds((current) => new Set(current).add(interactionKey));

      const currentQuantity = getStickerQuantity(collection, pageId, stickerId);
      const removesRepeatedSticker = currentQuantity > 1 && quantity <= 1;

      if (removesRepeatedSticker) {
        setFocusTarget(getNextFocusTarget(state, pageId, stickerId));
      }

      try {
        await onSetStickerQuantity(pageId, stickerId, quantity);
      } finally {
        pendingRef.current.delete(interactionKey);
        setPendingStickerIds((current) => {
          const next = new Set(current);
          next.delete(interactionKey);
          return next;
        });
      }
    },
    [collection, onSetStickerQuantity, state]
  );

  return (
    <div ref={screenRef} className={styles.screen} data-testid="repeated-screen">
      <header className={styles.header}>
        <button
          ref={backButtonRef}
          type="button"
          className={styles.iconButton}
          onClick={onBack}
          aria-label={t('repeated.header.back')}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{t('repeated.header.title')}</h1>
        {state.kind === 'ready' && onShare ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onShare}
            aria-label={t('repeated.header.share')}
          >
            <Share2 size={20} aria-hidden="true" />
          </button>
        ) : (
          <span className={styles.headerSpacer} aria-hidden="true" />
        )}
      </header>

      <section className={styles.summarySection} aria-label={t('repeated.summary.ariaLabel')}>
        <p className={styles.summaryValue} data-testid="repeated-summary-count">
          {t('repeated.summary.totalRepeated', { count: state.totalRepeatedCount })}
        </p>
      </section>

      <section className={styles.content} aria-label={t('repeated.content.ariaLabel')}>
        <section className={styles.intro}>
          <h2 className={styles.introTitle}>{t('repeated.intro.title')}</h2>
          <p className={styles.introDescription}>{t('repeated.intro.description')}</p>
        </section>

        {state.kind === 'empty' ? (
          <section className={styles.emptyState} aria-live="polite">
            <h2 className={styles.emptyTitle}>{t('repeated.empty.title')}</h2>
            <p className={styles.emptyDescription}>{t('repeated.empty.description')}</p>
            <button
              ref={emptyStateRef}
              type="button"
              className={styles.emptyBackButton}
              onClick={onBack}
            >
              {t('repeated.empty.backHome')}
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
              const blockMeta = getPageMetaLabel(page, t);
              const specialIconSrc = getSpecialIconSrc(page);

              return (
                <section
                  key={pageBlock.pageId}
                  className={styles.block}
                  data-testid={`repeated-block-${pageBlock.pageId}`}
                >
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
                      aria-label={t('repeated.block.repeatedCount', {
                        count: pageBlock.repeatedCount
                      })}
                    >
                      {numberFormatter.format(pageBlock.repeatedCount)}
                    </span>
                  </header>

                  <div className={styles.grid}>
                    {pageBlock.repeatedStickerIds.map((stickerId) => (
                      <RepeatedStickerButton
                        key={stickerId}
                        page={page}
                        stickerId={stickerId}
                        quantity={getStickerQuantity(collection, page.pageId, stickerId)}
                        isPending={pendingStickerIds.has(
                          getStickerInteractionKey(page.pageId, stickerId)
                        )}
                        onSetStickerQuantity={handleSetStickerQuantity}
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
      </footer>
    </div>
  );
}

type RepeatedStickerButtonProps = Readonly<{
  page: (typeof albumPages)[number];
  stickerId: StickerIdentifier;
  quantity: number;
  isPending: boolean;
  onSetStickerQuantity: (
    pageId: PageId,
    stickerId: StickerIdentifier,
    quantity: number
  ) => Promise<void>;
}>;

function RepeatedStickerButton({
  page,
  stickerId,
  quantity,
  isPending,
  onSetStickerQuantity
}: RepeatedStickerButtonProps) {
  const handleSetStickerQuantity = useCallback(
    (_: StickerIdentifier, nextQuantity: number) => {
      void onSetStickerQuantity(page.pageId, stickerId, nextQuantity);
    },
    [onSetStickerQuantity, page.pageId, stickerId]
  );

  return (
    <StickerCell
      dataTestId={getStickerInteractionKey(page.pageId, stickerId)}
      page={page}
      stickerId={stickerId}
      quantity={quantity}
      onSetStickerQuantity={handleSetStickerQuantity}
      disabled={isPending}
    />
  );
}

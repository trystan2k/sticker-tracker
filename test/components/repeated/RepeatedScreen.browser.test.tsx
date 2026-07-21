import { describe, expect, it, vi } from 'vitest';

import React, { useMemo, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import {
  getStickerInteractionKey,
  STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS
} from '@/components/album-viewer/sticker-cell-interactions';
import { RepeatedScreen } from '@/components/repeated/RepeatedScreen';
import { buildRepeatedState } from '@/components/repeated/repeated-state';
import type { PageId, StickerIdentifier } from '@/data/album';
import type { CollectionState } from '@/services/collection-service';
import { createCollectionState } from '../../helpers/typed-factories';
import { waitForCondition } from '../../helpers/async';

function mount(node: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(node);
  return { container, root };
}

function cleanup(mounted: { container: HTMLDivElement; root: Root }) {
  mounted.root.unmount();
  mounted.container.remove();
}

function setStickerQuantity(
  collection: CollectionState,
  pageId: PageId,
  stickerId: StickerIdentifier,
  quantity: number
): CollectionState {
  const nextState = {
    ...collection,
    [pageId]: {
      ...collection[pageId]
    }
  } as Record<string, Record<string, number>>;

  if (quantity <= 0) {
    if (nextState[pageId]) {
      delete nextState[pageId][stickerId];
    }

    if (nextState[pageId] && Object.keys(nextState[pageId]).length === 0) {
      delete nextState[pageId];
    }
  } else {
    nextState[pageId] ??= {};
    nextState[pageId][stickerId] = quantity;
  }

  return nextState;
}

function RepeatedScreenHarness({
  initialCollection
}: Readonly<{ initialCollection: CollectionState }>) {
  const [collection, setCollection] = useState(initialCollection);
  const state = useMemo(() => buildRepeatedState(collection), [collection]);

  return (
    <RepeatedScreen
      collection={collection}
      state={state}
      onBack={() => {}}
      onShare={() => {}}
      onSetStickerQuantity={async (pageId, stickerId, quantity) => {
        let nextCollection = collection;
        setCollection((currentCollection) => {
          nextCollection = setStickerQuantity(currentCollection, pageId, stickerId, quantity);
          return nextCollection;
        });

        return {
          state: 'ready' as const,
          value: nextCollection
        };
      }}
    />
  );
}

function getStickerButtonSelector(pageId: PageId, stickerId: StickerIdentifier): string {
  return `[data-testid="${getStickerInteractionKey(pageId, stickerId)}"]`;
}

describe('RepeatedScreen', () => {
  it('renders grouped repeated page blocks without progress UI', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 3,
            'MEX-2': 2
          },
          rsa: {
            'RSA-1': 2
          }
        })}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Repeated Stickers') ?? false
      );

      expect(mounted.container.querySelector('[data-testid="repeated-block-mex"]')).not.toBeNull();
      expect(mounted.container.querySelector('[data-testid="repeated-block-rsa"]')).not.toBeNull();
      expect(mounted.container.textContent).toContain('4 repeated stickers');
      expect(mounted.container.querySelector('progress')).toBeNull();
      expect(
        mounted.container.querySelector('button[aria-label="Share repeated stickers"]')
      ).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onShare from header action when repeated stickers exist', async () => {
    const onShare = vi.fn<() => void>();
    const mounted = mount(
      <RepeatedScreen
        collection={createCollectionState({
          mex: {
            'MEX-1': 2
          }
        })}
        state={buildRepeatedState(
          createCollectionState({
            mex: {
              'MEX-1': 2
            }
          })
        )}
        onBack={() => {}}
        onShare={onShare}
        onSetStickerQuantity={async () => ({
          state: 'ready',
          value: createCollectionState({
            mex: {
              'MEX-1': 2
            }
          })
        })}
      />
    );

    try {
      await waitForCondition(
        () =>
          mounted.container.querySelector('button[aria-label="Share repeated stickers"]') !== null
      );

      const shareButton = mounted.container.querySelector(
        'button[aria-label="Share repeated stickers"]'
      ) as HTMLButtonElement;
      shareButton.click();

      expect(onShare).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('refreshes repeated totals after increment and decrement interactions', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2
          }
        })}
      />
    );

    try {
      const stickerSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );

      await waitForCondition(() => mounted.container.querySelector(stickerSelector) !== null);

      const stickerButton = mounted.container.querySelector(stickerSelector) as HTMLButtonElement;
      stickerButton.click();

      await new Promise((resolve) => {
        window.setTimeout(resolve, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS + 30);
      });

      await waitForCondition(
        () => mounted.container.textContent?.includes('2 repeated stickers') ?? false
      );
      expect(mounted.container.textContent).toContain('2 repeated');

      stickerButton.click();
      await new Promise((resolve) => {
        window.setTimeout(resolve, Math.floor(STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS / 2));
      });
      stickerButton.click();

      await waitForCondition(
        () => mounted.container.textContent?.includes('1 repeated sticker') ?? false
      );
      expect(mounted.container.textContent).toContain('1 repeated');
    } finally {
      cleanup(mounted);
    }
  });

  it('collapses a page block when its last repeated sticker is cleared', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2
          },
          rsa: {
            'RSA-1': 2
          }
        })}
      />
    );

    try {
      const stickerSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );

      await waitForCondition(
        () =>
          mounted.container.querySelector('[data-testid="repeated-block-mex"]') !== null &&
          mounted.container.querySelector(stickerSelector) !== null
      );

      const stickerButton = mounted.container.querySelector(stickerSelector) as HTMLButtonElement;
      stickerButton.click();
      await new Promise((resolve) => {
        window.setTimeout(resolve, Math.floor(STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS / 2));
      });
      stickerButton.click();

      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="repeated-block-mex"]') === null
      );

      expect(mounted.container.querySelector('[data-testid="repeated-block-rsa"]')).not.toBeNull();
      expect(mounted.container.querySelector(stickerSelector)).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('shows empty state when all repeated stickers are cleared', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2
          }
        })}
      />
    );

    try {
      const stickerSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );

      await waitForCondition(() => mounted.container.querySelector(stickerSelector) !== null);

      const stickerButton = mounted.container.querySelector(stickerSelector) as HTMLButtonElement;
      stickerButton.click();
      await new Promise((resolve) => {
        window.setTimeout(resolve, Math.floor(STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS / 2));
      });
      stickerButton.click();

      await waitForCondition(
        () => mounted.container.textContent?.includes('No repeated stickers') ?? false
      );

      expect(mounted.container.textContent).toContain('You have no repeated stickers left.');
      expect(mounted.container.querySelector('[data-testid="repeated-block-mex"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('moves keyboard focus to next repeated sticker when current block disappears', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2
          },
          rsa: {
            'RSA-1': 2
          }
        })}
      />
    );

    try {
      const currentSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );
      const nextSelector = getStickerButtonSelector('rsa' as PageId, 'RSA-1' as StickerIdentifier);

      await waitForCondition(
        () =>
          mounted.container.querySelector(currentSelector) !== null &&
          mounted.container.querySelector(nextSelector) !== null
      );

      const currentButton = mounted.container.querySelector(currentSelector) as HTMLButtonElement;
      const nextButton = mounted.container.querySelector(nextSelector) as HTMLButtonElement;

      currentButton.focus();
      currentButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));

      await waitForCondition(() => document.activeElement === nextButton);

      expect(mounted.container.querySelector('[data-testid="repeated-block-mex"]')).toBeNull();
      expect(document.activeElement).toBe(nextButton);
    } finally {
      cleanup(mounted);
    }
  });

  it('moves keyboard focus to previous repeated sticker when removing last sticker in a block', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2,
            'MEX-2': 2
          }
        })}
      />
    );

    try {
      const previousSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );
      const currentSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-2' as StickerIdentifier
      );

      await waitForCondition(
        () =>
          mounted.container.querySelector(previousSelector) !== null &&
          mounted.container.querySelector(currentSelector) !== null
      );

      const previousButton = mounted.container.querySelector(previousSelector) as HTMLButtonElement;
      const currentButton = mounted.container.querySelector(currentSelector) as HTMLButtonElement;

      currentButton.focus();
      currentButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));

      await waitForCondition(() => document.activeElement === previousButton);

      expect(mounted.container.querySelector(currentSelector)).toBeNull();
      expect(document.activeElement).toBe(previousButton);
    } finally {
      cleanup(mounted);
    }
  });

  it('moves keyboard focus to previous page when current page disappears and no next page exists', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2
          },
          rsa: {
            'RSA-1': 2
          }
        })}
      />
    );

    try {
      const previousSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );
      const currentSelector = getStickerButtonSelector(
        'rsa' as PageId,
        'RSA-1' as StickerIdentifier
      );

      await waitForCondition(
        () =>
          mounted.container.querySelector(previousSelector) !== null &&
          mounted.container.querySelector(currentSelector) !== null
      );

      const previousButton = mounted.container.querySelector(previousSelector) as HTMLButtonElement;
      const currentButton = mounted.container.querySelector(currentSelector) as HTMLButtonElement;

      currentButton.focus();
      currentButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));

      await waitForCondition(() => document.activeElement === previousButton);

      expect(mounted.container.querySelector('[data-testid="repeated-block-rsa"]')).toBeNull();
      expect(document.activeElement).toBe(previousButton);
    } finally {
      cleanup(mounted);
    }
  });

  it('moves keyboard focus to empty-state CTA when last repeated sticker is removed', async () => {
    const mounted = mount(
      <RepeatedScreenHarness
        initialCollection={createCollectionState({
          mex: {
            'MEX-1': 2
          }
        })}
      />
    );

    try {
      const stickerSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );

      await waitForCondition(() => mounted.container.querySelector(stickerSelector) !== null);

      const stickerButton = mounted.container.querySelector(stickerSelector) as HTMLButtonElement;

      stickerButton.focus();
      stickerButton.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true })
      );

      await waitForCondition(
        () => mounted.container.textContent?.includes('No repeated stickers') ?? false
      );

      const emptyBackButton = Array.from(mounted.container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Go to home'
      ) as HTMLButtonElement;

      await waitForCondition(() => document.activeElement === emptyBackButton);

      expect(document.activeElement).toBe(emptyBackButton);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders opening and sponsor repeated blocks without share action when handler is missing', async () => {
    const collection = createCollectionState({
      'fwc-opening': {
        '00': 2
      },
      'coca-cola': {
        CC1: 2
      }
    });

    const mounted = mount(
      <RepeatedScreen
        collection={collection}
        state={buildRepeatedState(collection)}
        onBack={() => {}}
        onSetStickerQuantity={async () => ({
          state: 'ready',
          value: collection
        })}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="repeated-block-fwc-opening"]') !== null
      );

      expect(mounted.container.textContent).toContain('FWC');
      expect(mounted.container.textContent).toContain('Coca-Cola');
      expect(mounted.container.textContent).toContain('Special');
      expect(mounted.container.querySelector('img[src="/images/fifa.png"]')).not.toBeNull();
      expect(mounted.container.querySelector('img[src="/images/cocacola.png"]')).not.toBeNull();
      expect(
        mounted.container.querySelector('button[aria-label="Share repeated stickers"]')
      ).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('reuses onBack for header and empty-state actions', async () => {
    const onBack = vi.fn<() => void>();
    const collection = createCollectionState({});

    const mounted = mount(
      <RepeatedScreen
        collection={collection}
        state={buildRepeatedState(collection)}
        onBack={onBack}
        onSetStickerQuantity={async () => ({
          state: 'ready',
          value: collection
        })}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('No repeated stickers') ?? false
      );

      const backButton = mounted.container.querySelector(
        'button[aria-label="Back"]'
      ) as HTMLButtonElement;
      const emptyBackButton = Array.from(mounted.container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Go to home'
      ) as HTMLButtonElement;

      backButton.click();
      emptyBackButton.click();

      expect(onBack).toHaveBeenCalledTimes(2);
    } finally {
      cleanup(mounted);
    }
  });

  it('ignores duplicate quantity updates while a repeated sticker request is pending', async () => {
    const collection = createCollectionState({
      mex: {
        'MEX-1': 2
      }
    });
    let resolveUpdate: ((value: { state: 'ready'; value: CollectionState }) => void) | null = null;
    const onSetStickerQuantity = vi.fn<
      (
        pageId: PageId,
        stickerId: StickerIdentifier,
        quantity: number
      ) => Promise<{ state: 'ready'; value: CollectionState }>
    >(
      () =>
        new Promise<{ state: 'ready'; value: CollectionState }>((resolve) => {
          resolveUpdate = resolve;
        })
    );

    const mounted = mount(
      <RepeatedScreen
        collection={collection}
        state={buildRepeatedState(collection)}
        onBack={() => {}}
        onShare={() => {}}
        onSetStickerQuantity={onSetStickerQuantity}
      />
    );

    try {
      const stickerSelector = getStickerButtonSelector(
        'mex' as PageId,
        'MEX-1' as StickerIdentifier
      );

      await waitForCondition(() => mounted.container.querySelector(stickerSelector) !== null);

      const stickerButton = mounted.container.querySelector(stickerSelector) as HTMLButtonElement;

      stickerButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      stickerButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(onSetStickerQuantity).toHaveBeenCalledTimes(1);
      expect(onSetStickerQuantity).toHaveBeenCalledWith('mex', 'MEX-1', 3);

      const pendingUpdate = resolveUpdate as
        | ((value: { state: 'ready'; value: CollectionState }) => void)
        | null;

      if (pendingUpdate === null) {
        throw new Error('Expected pending quantity update resolver');
      }

      pendingUpdate({ state: 'ready', value: collection });
      await waitForCondition(() => !stickerButton.disabled);
    } finally {
      cleanup(mounted);
    }
  });
});

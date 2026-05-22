import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { MissingScreen } from '@/components/missing/MissingScreen';
import { buildMissingState } from '@/components/missing/missing-state';
import { albumPages } from '@/data/album';
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

function createCollectionWithOnlyMissing(stickerIdsByPage: Record<string, readonly string[]>) {
  const fullStateSeed = buildMissingState(createCollectionState({}));

  if (fullStateSeed.kind !== 'ready') {
    throw new Error('Expected ready state for collection seed');
  }

  const fullCollectedEntries = Object.fromEntries(
    fullStateSeed.pages.map((page) => [
      String(page.pageId),
      page.missingStickerIds.map((stickerId) => String(stickerId))
    ])
  ) as Record<string, string[]>;

  for (const [pageId, stickerIds] of Object.entries(stickerIdsByPage)) {
    fullCollectedEntries[pageId] = (fullCollectedEntries[pageId] ?? []).filter(
      (stickerId) => !stickerIds.includes(stickerId)
    );
  }

  return createCollectionState(fullCollectedEntries);
}

describe('MissingScreen', () => {
  it('renders blocks and optimistically removes sticker on collect', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));
    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({ mex: ['MEX-1'] })}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Missing Stickers') ?? false
      );
      const expectedTotalMissing = buildMissingState(createCollectionState({ mex: ['MEX-1'] }));
      expect(mounted.container.textContent).toContain(
        `${expectedTotalMissing.totalMissingCount} missing`
      );

      const target = mounted.container.querySelector('[data-testid="MEX-2"]') as HTMLButtonElement;
      target.focus();
      target.click();

      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="MEX-2"]') === null
      );
      expect(onToggleCollected).toHaveBeenCalledTimes(1);
      expect(mounted.container.textContent).toContain('Stickers marked as collected successfully.');
    } finally {
      cleanup(mounted);
    }
  });

  it('focuses empty-state action when single-page last sticker is removed', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const collection = createCollectionWithOnlyMissing({
      mex: ['MEX-20']
    });

    const mounted = mount(
      <MissingScreen
        collection={collection}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="MEX-20"]') !== null
      );

      const stickerButton = mounted.container.querySelector(
        '[data-testid="MEX-20"]'
      ) as HTMLButtonElement;
      stickerButton.focus();
      stickerButton.click();

      await waitForCondition(
        () => mounted.container.textContent?.includes('Album complete') ?? false
      );
      const emptyStateBack = mounted.container.querySelector('button[class*="emptyBackButton"]');
      expect(document.activeElement).toBe(emptyStateBack);
    } finally {
      cleanup(mounted);
    }
  });

  it('focuses back button when removing last sticker from final page while other pages remain', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const lastPage = albumPages.at(-1);

    if (!lastPage) {
      throw new Error('Expected album pages to exist');
    }

    const lastStickerId = lastPage.stickerIds.at(-1);

    if (!lastStickerId) {
      throw new Error('Expected last page to have sticker ids');
    }

    const collection = createCollectionWithOnlyMissing({
      mex: ['MEX-20'],
      [String(lastPage.pageId)]: [String(lastStickerId)]
    });

    const mounted = mount(
      <MissingScreen
        collection={collection}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      const targetStickerId = String(lastStickerId);
      await waitForCondition(
        () => mounted.container.querySelector(`[data-testid="${targetStickerId}"]`) !== null
      );

      const stickerButton = mounted.container.querySelector(
        `[data-testid="${targetStickerId}"]`
      ) as HTMLButtonElement;
      stickerButton.focus();
      stickerButton.click();

      await waitForCondition(() => {
        const backButton = mounted.container.querySelector('button[aria-label="Back"]');

        return document.activeElement === backButton;
      });

      expect(document.activeElement).toBe(
        mounted.container.querySelector('button[aria-label="Back"]')
      );
    } finally {
      cleanup(mounted);
    }
  });

  it('renders all-complete empty state and hides share action', async () => {
    const fullStateSeed = buildMissingState(createCollectionState({}));

    if (fullStateSeed.kind !== 'ready') {
      throw new Error('Expected ready state for full collection seed');
    }

    const fullCollection = createCollectionState(
      Object.fromEntries(
        fullStateSeed.pages.map((page) => [
          String(page.pageId),
          page.missingStickerIds.map((stickerId) => String(stickerId))
        ])
      )
    );

    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const mounted = mount(
      <MissingScreen
        collection={fullCollection}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Album complete') ?? false
      );
      const shareButton = mounted.container.querySelector(
        'button[aria-label="Share missing stickers"]'
      );

      expect(shareButton).toBeNull();
      expect(mounted.container.textContent).toContain('You collected all stickers.');
    } finally {
      cleanup(mounted);
    }
  });

  it('enables share action when missing stickers exist', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));
    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({})}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Missing Stickers') ?? false
      );

      const shareButton = mounted.container.querySelector(
        'button[aria-label="Share missing stickers"]'
      ) as HTMLButtonElement;
      expect(shareButton?.disabled).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('rolls back optimistic removal when toggle fails', async () => {
    const onToggleCollected = vi.fn<() => Promise<{ state: 'unavailable' }>>(async () => ({
      state: 'unavailable'
    }));

    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({ mex: ['MEX-1'] })}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="MEX-2"]') !== null
      );

      const stickerButton = mounted.container.querySelector(
        '[data-testid="MEX-2"]'
      ) as HTMLButtonElement;
      stickerButton.click();

      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="MEX-2"]') !== null
      );
      expect(onToggleCollected).toHaveBeenCalledTimes(1);
      expect(
        mounted.container.textContent?.includes('Stickers marked as collected successfully.')
      ).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders special page badges for fifa and coca-cola blocks', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({})}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Missing Stickers') ?? false
      );
      const fifaImages = mounted.container.querySelectorAll('img[src="/images/fifa.png"]');
      const cocaImages = mounted.container.querySelectorAll('img[src="/images/cocacola.png"]');

      expect(fifaImages.length).toBeGreaterThan(0);
      expect(cocaImages.length).toBeGreaterThan(0);
    } finally {
      cleanup(mounted);
    }
  });

  it('moves focus to next sticker in same block after removal', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({ mex: ['MEX-1'] })}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="MEX-2"]') !== null
      );

      const stickerButton = mounted.container.querySelector(
        '[data-testid="MEX-2"]'
      ) as HTMLButtonElement;
      stickerButton.focus();
      stickerButton.click();

      await waitForCondition(
        () => document.activeElement === mounted.container.querySelector('[data-testid="MEX-3"]')
      );

      expect(document.activeElement).toBe(mounted.container.querySelector('[data-testid="MEX-3"]'));
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onShare from header action when ready', async () => {
    const onShare = vi.fn<() => void>();
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(async () => ({ state: 'ready' as const, value: createCollectionState({}) }));

    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({ mex: ['MEX-1'] })}
        onBack={() => {}}
        onShare={onShare}
        onToggleCollected={onToggleCollected}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Missing Stickers') ?? false
      );

      const shareButton = mounted.container.querySelector(
        'button[aria-label="Share missing stickers"]'
      ) as HTMLButtonElement;
      shareButton.click();

      expect(onShare).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('blocks rapid double tap for same sticker while pending', async () => {
    const onToggleCollected = vi.fn<
      () => Promise<{ state: 'ready'; value: ReturnType<typeof createCollectionState> }>
    >(
      () =>
        new Promise((resolve) =>
          window.setTimeout(() => resolve({ state: 'ready', value: createCollectionState({}) }), 30)
        )
    );

    const mounted = mount(
      <MissingScreen
        collection={createCollectionState({ mex: ['MEX-1'] })}
        onBack={() => {}}
        onShare={() => {}}
        onToggleCollected={onToggleCollected as never}
      />
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="MEX-2"]') !== null
      );

      const stickerButton = mounted.container.querySelector(
        '[data-testid="MEX-2"]'
      ) as HTMLButtonElement;
      stickerButton.click();
      stickerButton.click();

      expect(onToggleCollected).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

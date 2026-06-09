import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import userEvent from '@testing-library/user-event';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { StickerCell } from '@/components/album-viewer/StickerCell';
import { STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS } from '@/components/album-viewer/sticker-cell-interactions';
import { albumPages } from '@/data/album';
import { waitForCondition } from '../../helpers/async';

function mount(node: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(node);

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

const teamPage = albumPages.find((page) => page.type === 'team');

if (!teamPage) {
  throw new Error('Expected team page fixture');
}

describe('StickerCell keyboard and pending interactions', () => {
  it('increments owned sticker immediately on Enter without deferred decrement behavior', async () => {
    const updates: number[] = [];
    const mounted = mount(
      <StickerCell
        page={teamPage}
        stickerId={teamPage.stickerIds[0]!}
        quantity={2}
        onSetStickerQuantity={(_, quantity) => {
          updates.push(quantity);
        }}
      />
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('button') !== null);

      const button = mounted.container.querySelector('button') as HTMLButtonElement;
      const user = userEvent.setup();

      button.focus();
      await user.keyboard('{Enter}');

      expect(updates).toEqual([3]);

      await new Promise((resolve) => {
        window.setTimeout(resolve, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS + 30);
      });

      expect(updates).toEqual([3]);
    } finally {
      cleanup(mounted);
    }
  });

  it('increments owned sticker immediately on Space without deferred decrement behavior', async () => {
    const updates: number[] = [];
    const mounted = mount(
      <StickerCell
        page={teamPage}
        stickerId={teamPage.stickerIds[0]!}
        quantity={2}
        onSetStickerQuantity={(_, quantity) => {
          updates.push(quantity);
        }}
      />
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('button') !== null);

      const button = mounted.container.querySelector('button') as HTMLButtonElement;
      const user = userEvent.setup();

      button.focus();
      await user.keyboard(' ');

      expect(updates).toEqual([3]);

      await new Promise((resolve) => {
        window.setTimeout(resolve, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS + 30);
      });

      expect(updates).toEqual([3]);
    } finally {
      cleanup(mounted);
    }
  });

  it('does not treat quick repeated keyboard activation as a double tap decrement', async () => {
    const updates: number[] = [];
    const mounted = mount(
      <StickerCell
        page={teamPage}
        stickerId={teamPage.stickerIds[0]!}
        quantity={1}
        onSetStickerQuantity={(_, quantity) => {
          updates.push(quantity);
        }}
      />
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('button') !== null);

      const button = mounted.container.querySelector('button') as HTMLButtonElement;
      const user = userEvent.setup();

      button.focus();
      await user.keyboard('{Enter}{Enter}');

      expect(updates).toEqual([2, 3]);

      await new Promise((resolve) => {
        window.setTimeout(resolve, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS + 30);
      });

      expect(updates).toEqual([2, 3]);
    } finally {
      cleanup(mounted);
    }
  });

  it('decrements owned sticker on Backspace for keyboard-only users', async () => {
    const updates: number[] = [];
    const mounted = mount(
      <StickerCell
        page={teamPage}
        stickerId={teamPage.stickerIds[0]!}
        quantity={3}
        onSetStickerQuantity={(_, quantity) => {
          updates.push(quantity);
        }}
      />
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('button') !== null);

      const button = mounted.container.querySelector('button') as HTMLButtonElement;
      const user = userEvent.setup();

      button.focus();
      await user.keyboard('{Backspace}');

      expect(updates).toEqual([2]);
      expect(button.getAttribute('aria-describedby')).toBeTruthy();

      const hint = mounted.container.querySelector(
        `#${button.getAttribute('aria-describedby') ?? ''}`
      ) as HTMLElement | null;

      expect(hint?.textContent).toContain('Backspace');
    } finally {
      cleanup(mounted);
    }
  });

  it('unmarks owned sticker on Delete when quantity is 1', async () => {
    const updates: number[] = [];
    const mounted = mount(
      <StickerCell
        page={teamPage}
        stickerId={teamPage.stickerIds[0]!}
        quantity={1}
        onSetStickerQuantity={(_, quantity) => {
          updates.push(quantity);
        }}
      />
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('button') !== null);

      const button = mounted.container.querySelector('button') as HTMLButtonElement;
      const user = userEvent.setup();

      button.focus();
      await user.keyboard('{Delete}');

      expect(updates).toEqual([0]);
    } finally {
      cleanup(mounted);
    }
  });

  it('flushes a pending owned single click when navigation unmounts the cell', async () => {
    const updates: number[] = [];
    const mounted = mount(
      <StickerCell
        page={teamPage}
        stickerId={teamPage.stickerIds[0]!}
        quantity={1}
        onSetStickerQuantity={(_, quantity) => {
          updates.push(quantity);
        }}
      />
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('button') !== null);

      const button = mounted.container.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(updates).toEqual([]);
    } finally {
      cleanup(mounted);
    }

    expect(updates).toEqual([2]);

    await new Promise((resolve) => {
      window.setTimeout(resolve, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS + 30);
    });

    expect(updates).toEqual([2]);
  });
});

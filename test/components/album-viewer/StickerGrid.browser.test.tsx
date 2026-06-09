import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import userEvent from '@testing-library/user-event';

import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { albumPages, type StickerIdentifier } from '@/data/album';
import { StickerGrid } from '@/components/album-viewer/StickerGrid';
import { AppStateProvider } from '@/providers/AppStateProvider';
import { STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS } from '@/components/album-viewer/sticker-cell-interactions';

function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      try {
        if (predicate()) {
          resolve();
          return;
        }
      } catch {
        // predicate may throw, keep polling
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('waitFor timeout'));
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}

function mount(child: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(child);

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

let testCounter = 0;

async function resetStorage() {
  testCounter++;
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  setDatabaseNameForTests(`test-stickergrid-${testCounter}`);
}

describe('StickerGrid', () => {
  describe('layout selection', () => {
    it('uses 4-column layout for team pages', async () => {
      await resetStorage();

      const teamPage = albumPages.find((p) => p.type === 'team')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page: teamPage,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const grid = mounted.container.querySelector('[class*="grid"]');
          return grid !== null;
        });

        const grid = mounted.container.querySelector('[class*="grid"]');
        expect(grid).not.toBeNull();

        // Team pages use gridItems class
        const gridItems = mounted.container.querySelector('[class*="gridItems"]');
        expect(gridItems).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('uses 4-column layout for coca-cola special page', async () => {
      await resetStorage();

      const cocaColaPage = albumPages.find((p) => p.type === 'special' && p.key === 'coca-cola')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page: cocaColaPage,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const grid = mounted.container.querySelector('[class*="grid"]');
          return grid !== null;
        });

        // Coca-Cola page now uses same gridItems class as all pages
        const gridItems = mounted.container.querySelector('[class*="gridItems"]');
        expect(gridItems).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('uses 4-column layout for non-coca-cola special pages', async () => {
      await resetStorage();

      const fwcOpeningPage = albumPages.find(
        (p) => p.type === 'special' && p.key === 'fwc-opening'
      )!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page: fwcOpeningPage,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const grid = mounted.container.querySelector('[class*="grid"]');
          return grid !== null;
        });

        // FWC opening page uses gridItems class (not coca-cola)
        const gridItems = mounted.container.querySelector('[class*="gridItems"]');
        expect(gridItems).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('click toggle', () => {
    it('renders all sticker cells with aria-pressed=false when none collected', async () => {
      await resetStorage();

      const page = albumPages[0]!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length > 0;
        });

        const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
        expect(buttons.length).toBe(page.stickerIds.length);

        // All should be aria-pressed="false" since none collected
        for (const button of buttons) {
          expect(button.getAttribute('aria-pressed')).toBe('false');
        }
      } finally {
        cleanup(mounted);
      }
    });

    it('increments missing sticker to qty 1 on single click', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: (stickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length > 0;
        });

        const firstButton = mounted.container.querySelector('button[aria-pressed]') as HTMLElement;
        expect(firstButton).not.toBeNull();

        firstButton.click();

        expect(quantityUpdates).toEqual([
          {
            stickerId: page.stickerIds[0]!,
            quantity: 1
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });

    it('renders collected stickers with aria-pressed=true', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const collectedId = page.stickerIds[0]!;
      const collectedSet = new Set<StickerIdentifier>([collectedId]);

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: collectedSet,
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length > 0;
        });

        const buttons = mounted.container.querySelectorAll('button[aria-pressed]');

        // First sticker should be collected (aria-pressed=true)
        expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');

        // Remaining stickers should not be collected
        for (let i = 1; i < buttons.length; i++) {
          expect(buttons[i]?.getAttribute('aria-pressed')).toBe('false');
        }
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('keyboard toggle', () => {
    it('triggers toggle via Enter key on sticker cell', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: (stickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length > 0;
        });

        const firstButton = mounted.container.querySelector(
          'button[aria-pressed]'
        ) as HTMLButtonElement;
        expect(firstButton).not.toBeNull();

        const user = userEvent.setup();
        firstButton.focus();
        await user.keyboard('{Enter}');

        expect(quantityUpdates).toEqual([
          {
            stickerId: page.stickerIds[0]!,
            quantity: 1
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });

    it('triggers toggle via Space key on sticker cell', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: (stickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length > 0;
        });

        const firstButton = mounted.container.querySelector(
          'button[aria-pressed]'
        ) as HTMLButtonElement;
        expect(firstButton).not.toBeNull();

        const user = userEvent.setup();
        firstButton.focus();
        await user.keyboard(' ');

        expect(quantityUpdates).toEqual([
          {
            stickerId: page.stickerIds[0]!,
            quantity: 1
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });

    it('decrements owned sticker via Backspace key on sticker cell', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>([stickerId]),
            stickerQuantities: {
              [stickerId]: 2
            },
            onSetStickerQuantity: (nextStickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId: nextStickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[aria-pressed="true"]') !== null
        );

        const firstButton = mounted.container.querySelector(
          'button[aria-pressed="true"]'
        ) as HTMLButtonElement;
        expect(firstButton).not.toBeNull();

        const user = userEvent.setup();
        firstButton.focus();
        await user.keyboard('{Backspace}');

        expect(quantityUpdates).toEqual([
          {
            stickerId,
            quantity: 1
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('quantity interactions', () => {
    it('defers owned single click increment until double-tap threshold expires', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>([stickerId]),
            stickerQuantities: {
              [stickerId]: 1
            },
            onSetStickerQuantity: (nextStickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId: nextStickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[aria-pressed="true"]') !== null
        );

        const firstButton = mounted.container.querySelector(
          'button[aria-pressed="true"]'
        ) as HTMLElement;

        firstButton.click();
        expect(quantityUpdates).toEqual([]);

        await new Promise((resolve) => {
          window.setTimeout(resolve, STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS - 10);
        });
        expect(quantityUpdates).toEqual([]);

        await new Promise((resolve) => {
          window.setTimeout(resolve, 20);
        });
        expect(quantityUpdates).toEqual([
          {
            stickerId,
            quantity: 2
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });

    it('lets double tap win over two quick single taps for qty 1', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>([stickerId]),
            stickerQuantities: {
              [stickerId]: 1
            },
            onSetStickerQuantity: (nextStickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId: nextStickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[aria-pressed="true"]') !== null
        );

        const firstButton = mounted.container.querySelector(
          'button[aria-pressed="true"]'
        ) as HTMLElement;

        firstButton.click();
        await new Promise((resolve) => {
          window.setTimeout(resolve, Math.floor(STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS / 2));
        });
        firstButton.click();

        await new Promise((resolve) => {
          window.setTimeout(resolve, 20);
        });

        expect(quantityUpdates).toEqual([
          {
            stickerId,
            quantity: 0
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });

    it('decrements owned sticker quantity on double tap when qty is 3', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;
      const quantityUpdates: Array<{ stickerId: StickerIdentifier; quantity: number }> = [];

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>([stickerId]),
            stickerQuantities: {
              [stickerId]: 3
            },
            onSetStickerQuantity: (nextStickerId: StickerIdentifier, quantity: number) => {
              quantityUpdates.push({ stickerId: nextStickerId, quantity });
            }
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[aria-pressed="true"]') !== null
        );

        const firstButton = mounted.container.querySelector(
          'button[aria-pressed="true"]'
        ) as HTMLElement;

        firstButton.click();
        await new Promise((resolve) => {
          window.setTimeout(resolve, Math.floor(STICKER_CELL_DOUBLE_TAP_THRESHOLD_MS / 2));
        });
        firstButton.click();

        await new Promise((resolve) => {
          window.setTimeout(resolve, 20);
        });

        expect(quantityUpdates).toEqual([
          {
            stickerId,
            quantity: 2
          }
        ]);
      } finally {
        cleanup(mounted);
      }
    });

    it('shows repeated badge and announces repeated count to screen readers', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>([stickerId]),
            stickerQuantities: {
              [stickerId]: 3
            },
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[aria-pressed="true"]') !== null
        );

        const firstButton = mounted.container.querySelector('button[aria-pressed="true"]');
        const badge = mounted.container.querySelector('[class*="badge"]');

        expect(badge?.textContent).toBe('2');
        expect(firstButton?.getAttribute('aria-label')).toContain('2 repeated copies');
      } finally {
        cleanup(mounted);
      }
    });

    it('hides repeated badge when repeated count is 0', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: new Set<StickerIdentifier>([stickerId]),
            stickerQuantities: {
              [stickerId]: 1
            },
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(
          () => mounted.container.querySelector('button[aria-pressed="true"]') !== null
        );

        expect(mounted.container.querySelector('[class*="badge"]')).toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('aria-pressed state changes', () => {
    it('reflects collected state change through aria-pressed', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const collectedId = page.stickerIds[1]!;
      const collectedSet = new Set<StickerIdentifier>([collectedId]);

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page,
            collectedStickerIds: collectedSet,
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length > 0;
        });

        const buttons = mounted.container.querySelectorAll('button[aria-pressed]');

        // Second sticker should be collected
        expect(buttons[1]?.getAttribute('aria-pressed')).toBe('true');

        // First sticker should NOT be collected
        expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false');
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('cell count matches page stickerIds', () => {
    it('renders exact number of sticker cells per page', async () => {
      await resetStorage();

      const teamPage = albumPages.find((p) => p.type === 'team')!;

      const mounted = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(StickerGrid, {
            page: teamPage,
            collectedStickerIds: new Set<StickerIdentifier>(),
            stickerQuantities: {},
            onSetStickerQuantity: () => {}
          })
        )
      );

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
          return buttons.length === teamPage.stickerIds.length;
        });

        const buttons = mounted.container.querySelectorAll('button[aria-pressed]');
        expect(buttons.length).toBe(teamPage.stickerIds.length);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('persistence with real storage', () => {
    it('sticker state persists after unmount and remount with real storage', async () => {
      await resetStorage();

      const page = albumPages[0]!;
      const stickerId = page.stickerIds[0]!;

      // First mount: toggle a sticker via context
      let capturedContext:
        | (typeof import('@/providers/AppStateProvider').AppStateContext extends React.Context<
            infer T
          >
            ? T
            : never)
        | null = null;

      const { AppStateContext } = await import('@/providers/AppStateProvider');

      function ContextReader() {
        capturedContext = React.useContext(AppStateContext);
        return React.createElement('div', { 'data-testid': 'context-captured' });
      }

      const mounted1 = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(
            React.Fragment,
            null,
            React.createElement(StickerGrid, {
              page,
              collectedStickerIds: new Set<StickerIdentifier>(),
              stickerQuantities: {},
              onSetStickerQuantity: () => {}
            }),
            React.createElement(ContextReader)
          )
        )
      );

      try {
        await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

        // Toggle sticker to collected
        const toggleResult = await capturedContext!.toggleCollected(page.pageId, stickerId);

        expect(toggleResult.state).toBe('ready');
      } finally {
        cleanup(mounted1);
      }

      // Second mount: verify sticker is still collected after re-bootstrap
      capturedContext = null;

      const mounted2 = mount(
        React.createElement(
          AppStateProvider,
          null,
          React.createElement(React.Fragment, null, React.createElement(ContextReader))
        )
      );

      try {
        await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

        // Collection should contain the previously toggled sticker
        const pageCollection = capturedContext!.collection[page.pageId];
        expect(pageCollection).toBeDefined();
        expect(pageCollection?.[stickerId]).toBe(1);
      } finally {
        cleanup(mounted2);
      }
    });
  });
});

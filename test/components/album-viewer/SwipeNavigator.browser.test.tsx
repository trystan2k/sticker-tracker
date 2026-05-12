import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { SwipeNavigator } from '@/components/album-viewer/SwipeNavigator';
import { SWIPE_THRESHOLD_PX } from '@/components/album-viewer/viewer-state';
import { type PageId } from '@/data/album';

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
        // keep polling
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

function createTouchLikeEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  x: number,
  y: number
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touchList = [{ clientX: x, clientY: y }];

  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' ? [] : touchList
  });

  Object.defineProperty(event, 'changedTouches', {
    value: touchList
  });

  return event;
}

function swipe(surface: HTMLElement, fromX: number, fromY: number, toX: number, toY: number): void {
  surface.dispatchEvent(createTouchLikeEvent('touchstart', fromX, fromY));
  surface.dispatchEvent(createTouchLikeEvent('touchmove', toX, toY));
  surface.dispatchEvent(createTouchLikeEvent('touchend', toX, toY));
}

describe('SwipeNavigator', () => {
  it('swipe left moves to next page', async () => {
    const mounted = mount(
      <SwipeNavigator initialPageId={'fwc-opening' as PageId}>
        {({ activePage }) => <p data-testid="active-page">{activePage.pageId}</p>}
      </SwipeNavigator>
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;
      swipe(surface, 200, 120, 200 - SWIPE_THRESHOLD_PX - 10, 120);

      await waitFor(
        () => mounted.container.querySelector('[data-testid="active-page"]')?.textContent === 'mex'
      );
      expect(mounted.container.querySelector('[data-testid="active-page"]')?.textContent).toBe(
        'mex'
      );
    } finally {
      cleanup(mounted);
    }
  });

  it('swipe right on first page wraps to last page', async () => {
    const mounted = mount(
      <SwipeNavigator initialPageId={'fwc-opening' as PageId}>
        {({ activePage }) => <p data-testid="active-page">{activePage.pageId}</p>}
      </SwipeNavigator>
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;
      swipe(surface, 120, 120, 120 + SWIPE_THRESHOLD_PX + 10, 120);

      await waitFor(
        () =>
          mounted.container.querySelector('[data-testid="active-page"]')?.textContent ===
          'coca-cola'
      );
      expect(mounted.container.querySelector('[data-testid="active-page"]')?.textContent).toBe(
        'coca-cola'
      );
    } finally {
      cleanup(mounted);
    }
  });

  it('does not navigate when below threshold', async () => {
    const mounted = mount(
      <SwipeNavigator initialPageId={'mex' as PageId}>
        {({ activePage }) => <p data-testid="active-page">{activePage.pageId}</p>}
      </SwipeNavigator>
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;
      swipe(surface, 200, 120, 200 - SWIPE_THRESHOLD_PX + 1, 120);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(mounted.container.querySelector('[data-testid="active-page"]')?.textContent).toBe(
        'mex'
      );
    } finally {
      cleanup(mounted);
    }
  });

  it('does not navigate on vertical drag', async () => {
    const mounted = mount(
      <SwipeNavigator initialPageId={'mex' as PageId}>
        {({ activePage }) => <p data-testid="active-page">{activePage.pageId}</p>}
      </SwipeNavigator>
    );

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="swipe-surface"]') !== null
      );

      // useEffect attaches the touchmove listener after paint; wait one frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const surface = mounted.container.querySelector(
        '[data-testid="swipe-surface"]'
      ) as HTMLElement;
      swipe(surface, 160, 120, 160 + SWIPE_THRESHOLD_PX + 20, 120 + SWIPE_THRESHOLD_PX + 80);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(mounted.container.querySelector('[data-testid="active-page"]')?.textContent).toBe(
        'mex'
      );
    } finally {
      cleanup(mounted);
    }
  });
});

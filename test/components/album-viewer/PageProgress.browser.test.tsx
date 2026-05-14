import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { PageProgress } from '@/components/album-viewer/PageProgress';

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

function waitFor(predicate: () => boolean, timeoutMs = 4000): Promise<void> {
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

describe('PageProgress', () => {
  it('shows 0% when totalCount is 0 (avoids division by zero)', async () => {
    const mounted = mount(React.createElement(PageProgress, { collectedCount: 0, totalCount: 0 }));

    try {
      await waitFor(() => mounted.container.querySelector('[role="progressbar"]') !== null);

      const percent = mounted.container.querySelector('[class*="percent"]');
      expect(percent?.textContent).toBe('0%');

      const progressbar = mounted.container.querySelector('[role="progressbar"]');
      expect(progressbar?.getAttribute('aria-valuenow')).toBe('0');
      expect(progressbar?.getAttribute('aria-valuemax')).toBe('0');
    } finally {
      cleanup(mounted);
    }
  });

  it('calculates percentage correctly when totalCount > 0', async () => {
    const mounted = mount(React.createElement(PageProgress, { collectedCount: 3, totalCount: 10 }));

    try {
      await waitFor(() => mounted.container.querySelector('[role="progressbar"]') !== null);

      const percent = mounted.container.querySelector('[class*="percent"]');
      expect(percent?.textContent).toBe('30%');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows 100% when all stickers collected', async () => {
    const mounted = mount(React.createElement(PageProgress, { collectedCount: 5, totalCount: 5 }));

    try {
      await waitFor(() => mounted.container.querySelector('[role="progressbar"]') !== null);

      const percent = mounted.container.querySelector('[class*="percent"]');
      expect(percent?.textContent).toBe('100%');
    } finally {
      cleanup(mounted);
    }
  });
});

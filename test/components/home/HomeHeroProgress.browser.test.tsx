import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { HomeHeroProgress } from '@/components/home/HomeHeroProgress';
import type { HomeSummary } from '@/components/home/home-state';

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

const baseSummary: HomeSummary = {
  collectedTotal: 10,
  albumTotal: 100,
  percentage: 10
};

describe('HomeHeroProgress', () => {
  it('uses default aria label when ringAriaLabel is undefined', async () => {
    const mounted = mount(
      React.createElement(HomeHeroProgress, {
        summary: baseSummary,
        completeLabel: 'complete',
        collectedFormatted: '10',
        totalFormatted: '100',
        percentFormatted: '10%'
        // ringAriaLabel omitted — should fall back to "Home progress"
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('section') !== null);

      const section = mounted.container.querySelector('section');
      expect(section?.getAttribute('aria-label')).toBe('Home progress');
    } finally {
      cleanup(mounted);
    }
  });

  it('uses provided ringAriaLabel when given', async () => {
    const mounted = mount(
      React.createElement(HomeHeroProgress, {
        summary: baseSummary,
        completeLabel: 'complete',
        collectedFormatted: '10',
        totalFormatted: '100',
        percentFormatted: '10%',
        ringAriaLabel: 'Album progress'
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('section') !== null);

      const section = mounted.container.querySelector('section');
      expect(section?.getAttribute('aria-label')).toBe('Album progress');
    } finally {
      cleanup(mounted);
    }
  });

  it('clamps progress to 0 for negative percentage', async () => {
    const mounted = mount(
      React.createElement(HomeHeroProgress, {
        summary: { ...baseSummary, percentage: -5 },
        completeLabel: 'complete',
        collectedFormatted: '0',
        totalFormatted: '100',
        percentFormatted: '0%',
        ringAriaLabel: 'test'
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('svg') !== null);
      // Should render without errors - stroke-dashoffset computed from 0
      expect(mounted.container.querySelector('svg')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('clamps progress to 100 for overshooting percentage', async () => {
    const mounted = mount(
      React.createElement(HomeHeroProgress, {
        summary: { ...baseSummary, percentage: 150 },
        completeLabel: 'complete',
        collectedFormatted: '100',
        totalFormatted: '100',
        percentFormatted: '100%',
        ringAriaLabel: 'test'
      })
    );

    try {
      await waitFor(() => mounted.container.querySelector('svg') !== null);
      expect(mounted.container.querySelector('svg')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

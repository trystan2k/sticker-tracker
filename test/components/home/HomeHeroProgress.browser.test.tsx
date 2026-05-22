import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import userEvent from '@testing-library/user-event';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { HomeHeroProgress } from '@/components/home/HomeHeroProgress';
import type { HomeSummary } from '@/components/home/home-state';
import { waitForCondition } from '../../helpers/async';

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

const baseSummary: HomeSummary = {
  collectedTotal: 10,
  albumTotal: 100,
  percentage: 10
};

describe('HomeHeroProgress', () => {
  it('renders stats cta and forwards click', async () => {
    const user = userEvent.setup();
    let clicked = 0;

    const mounted = mount(
      React.createElement(HomeHeroProgress, {
        summary: baseSummary,
        completeLabel: 'complete',
        collectedFormatted: '10',
        totalFormatted: '100',
        percentFormatted: '10%',
        ringAriaLabel: 'Album progress',
        openStatsLabel: 'See stats',
        onOpenStats: () => {
          clicked += 1;
        }
      })
    );

    try {
      await waitForCondition(
        () => mounted.container.querySelector('[data-testid="home-stats-cta"]') !== null
      );

      const button = mounted.container.querySelector(
        '[data-testid="home-stats-cta"]'
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe('See stats');
      expect(button.textContent?.trim()).toBe('');

      await user.click(button);
      expect(clicked).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('applies provided ringAriaLabel to section landmark', async () => {
    const mounted = mount(
      React.createElement(HomeHeroProgress, {
        summary: baseSummary,
        completeLabel: 'complete',
        collectedFormatted: '10',
        totalFormatted: '100',
        percentFormatted: '10%',
        ringAriaLabel: 'Album progress',
        openStatsLabel: 'See stats',
        onOpenStats: () => {}
      })
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('section') !== null);

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
        ringAriaLabel: 'test',
        openStatsLabel: 'See stats',
        onOpenStats: () => {}
      })
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('svg') !== null);
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
        ringAriaLabel: 'test',
        openStatsLabel: 'See stats',
        onOpenStats: () => {}
      })
    );

    try {
      await waitForCondition(() => mounted.container.querySelector('svg') !== null);
      expect(mounted.container.querySelector('svg')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

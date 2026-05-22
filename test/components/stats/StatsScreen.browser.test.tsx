import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { StatsScreen } from '@/components/stats/StatsScreen';
import type { StatsState } from '@/components/stats/stats-state';
import { createPageId } from '../../helpers/typed-factories';
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

const readyState: StatsState = {
  kind: 'ready',
  teams: {
    moreStickers: {
      pageId: createPageId('rsa'),
      albumCode: 'RSA',
      group: 'A',
      flagCode: 'za',
      translationKey: 'team.rsa',
      collected: 4,
      total: 20
    },
    lessStickers: {
      pageId: createPageId('can'),
      albumCode: 'CAN',
      group: 'B',
      flagCode: 'ca',
      translationKey: 'team.can',
      collected: 0,
      total: 20
    }
  },
  groups: {
    moreStickers: {
      group: 'B',
      collected: 4,
      total: 80
    },
    lessStickers: {
      group: 'D',
      collected: 0,
      total: 80
    }
  },
  completedGroups: ['A'],
  incompleteGroups: ['B', 'C', 'D']
};

describe('StatsScreen', () => {
  it('renders spotlight and panorama data for ready state', async () => {
    const onBack = vi.fn<() => void>();
    const mounted = mount(<StatsScreen onBack={onBack} state={readyState} />);

    try {
      await waitForCondition(
        () => mounted.container.textContent?.includes('Featured teams') ?? false
      );

      expect(mounted.container.textContent).toContain('Featured teams');
      expect(mounted.container.textContent).toContain('More stickers');
      expect(mounted.container.textContent).toContain('Less stickers');
      expect(mounted.container.textContent).toContain('South Africa');
      expect(mounted.container.textContent).toContain('16 missing');
      expect(mounted.container.textContent).toContain('Group A · closest to the finish');
      expect(mounted.container.textContent).toContain('4/20');
      expect(mounted.container.textContent).toContain('20 missing');
      const spotlightSection = mounted.container
        .querySelector('#stats-spotlight-section-title')
        ?.closest('section');
      expect(spotlightSection).toBeTruthy();

      const lessMissingSpotlightCard = Array.from(
        spotlightSection?.querySelectorAll('article') ?? []
      ).find((card) => card.textContent?.includes('Less stickers') ?? false);

      expect(lessMissingSpotlightCard).toBeTruthy();
      expect(lessMissingSpotlightCard?.textContent).toContain('Group B · biggest delay');
      expect(mounted.container.textContent).toContain('Group D');
      expect(mounted.container.textContent).toContain('0/20');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders neutral empty state for zero-progress', async () => {
    const mounted = mount(<StatsScreen onBack={() => {}} state={{ kind: 'zero-progress' }} />);

    try {
      await waitForCondition(
        () =>
          mounted.container.textContent?.includes(
            'Start collecting stickers to unlock this section.'
          ) ?? false
      );

      expect(mounted.container.textContent).toContain(
        'Start collecting stickers to unlock this section.'
      );
      expect(mounted.container.textContent).toContain('All groups');
      expect(mounted.container.textContent).toContain('None');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders neutral empty state for all-complete', async () => {
    const mounted = mount(<StatsScreen onBack={() => {}} state={{ kind: 'all-complete' }} />);

    try {
      await waitForCondition(
        () =>
          mounted.container.textContent?.includes(
            'Start collecting stickers to unlock this section.'
          ) ?? false
      );

      expect(mounted.container.textContent).toContain(
        'Start collecting stickers to unlock this section.'
      );
      expect(mounted.container.textContent).toContain('All groups');
      expect(mounted.container.textContent).toContain('None');
    } finally {
      cleanup(mounted);
    }
  });
});

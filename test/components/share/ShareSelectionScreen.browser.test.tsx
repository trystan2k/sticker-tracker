import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { initializeI18n } from '@/i18n/config';

import type { ShareSelectionSection } from '@/components/share/share-state';
import type { PageId } from '@/data/album';
import { ShareSelectionScreen } from '@/components/share/ShareSelectionScreen';

function mount(component: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(component);
  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

function makeSections(): readonly ShareSelectionSection[] {
  return [
    {
      sectionId: 'group-a',
      sectionLabel: 'album.quickNavigation.sections.group-a',
      rows: [
        {
          pageId: 'arg' as PageId,
          title: 'arg',
          flagCode: 'ar',
          group: 'A',
          pageType: 'team',
          missingCount: 20
        },
        {
          pageId: 'bra' as PageId,
          title: 'bra',
          flagCode: 'br',
          group: 'A',
          pageType: 'team',
          missingCount: 0
        }
      ]
    },
    {
      sectionId: 'special',
      sectionLabel: 'album.quickNavigation.sections.special',
      rows: [
        {
          pageId: 'fwc-opening' as PageId,
          title: 'fwc-opening',
          pageType: 'special',
          specialKey: 'fwc-opening',
          missingCount: 9
        }
      ]
    }
  ];
}

function makeEmptySections(): readonly ShareSelectionSection[] {
  return [
    {
      sectionId: 'group-a',
      sectionLabel: 'album.quickNavigation.sections.group-a',
      rows: [
        {
          pageId: 'arg' as PageId,
          title: 'arg',
          flagCode: 'ar',
          group: 'A',
          pageType: 'team',
          missingCount: 0
        }
      ]
    }
  ];
}

describe('ShareSelectionScreen', () => {
  it('renders with selection sections', async () => {
    await initializeI18n('en');

    const sections = makeSections();
    const onBack = vi.fn<() => void>();
    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const onSelectAll = vi.fn<() => void>();
    const onClear = vi.fn<() => void>();
    const onGenerate = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack,
        onTogglePage,
        onSelectAll,
        onClear,
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('Share');
      expect(text).toContain('Select all');
      expect(text).toContain('Generate');
    } finally {
      cleanup(mounted);
    }
  });

  it('shows empty state when no pages have missing stickers', async () => {
    await initializeI18n('en');

    const sections = makeEmptySections();
    const onBack = vi.fn<() => void>();
    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const onSelectAll = vi.fn<() => void>();
    const onClear = vi.fn<() => void>();
    const onGenerate = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack,
        onTogglePage,
        onSelectAll,
        onClear,
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('No missing stickers to share');
    } finally {
      cleanup(mounted);
    }
  });

  it('filters out rows with zero missing count', async () => {
    await initializeI18n('en');

    const sections = makeSections();
    const onBack = vi.fn<() => void>();
    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const onSelectAll = vi.fn<() => void>();
    const onClear = vi.fn<() => void>();
    const onGenerate = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack,
        onTogglePage,
        onSelectAll,
        onClear,
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      const checkboxes = mounted.container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(2);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onTogglePage when checkbox is clicked', async () => {
    await initializeI18n('en');

    const sections = makeSections();
    const onBack = vi.fn<() => void>();
    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const onSelectAll = vi.fn<() => void>();
    const onClear = vi.fn<() => void>();
    const onGenerate = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack,
        onTogglePage,
        onSelectAll,
        onClear,
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      const checkbox = mounted.container.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toBeNull();

      // React handles click on checkbox, not change event
      checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(onTogglePage).toHaveBeenCalledWith('arg');
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onBack when back button is clicked', async () => {
    await initializeI18n('en');

    const sections = makeSections();
    const onBack = vi.fn<() => void>();
    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const onSelectAll = vi.fn<() => void>();
    const onClear = vi.fn<() => void>();
    const onGenerate = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack,
        onTogglePage,
        onSelectAll,
        onClear,
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      const buttons = mounted.container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(onBack).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('shows selected count', async () => {
    await initializeI18n('en');

    const sections = makeSections();
    const onBack = vi.fn<() => void>();
    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const onSelectAll = vi.fn<() => void>();
    const onClear = vi.fn<() => void>();
    const onGenerate = vi.fn<() => void>();

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: ['arg' as PageId],
        onBack,
        onTogglePage,
        onSelectAll,
        onClear,
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 50));

      const text = mounted.container.textContent;
      expect(text).toContain('1 selected');
    } finally {
      cleanup(mounted);
    }
  });
});

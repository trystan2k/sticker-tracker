import { afterEach, describe, expect, it, vi } from 'vitest';

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

function makeTeamSection(): ShareSelectionSection {
  return {
    sectionId: 'groups',
    sectionLabel: 'share.selection.groups',
    rows: [
      {
        pageId: 'mex' as PageId,
        title: 'team.mex',
        pageType: 'team',
        flagCode: 'us',
        group: 'A',
        missingCount: 5
      },
      {
        pageId: 'usa' as PageId,
        title: 'team.usa',
        pageType: 'team',
        flagCode: 'us',
        group: 'A',
        missingCount: 0
      }
    ]
  };
}

function makeSpecialSection(): ShareSelectionSection {
  return {
    sectionId: 'special',
    sectionLabel: 'share.selection.special',
    rows: [
      {
        pageId: 'fwc-opening' as PageId,
        title: 'album.specialSection.fwc-opening',
        pageType: 'special',
        specialKey: 'fwc-opening',
        missingCount: 3
      }
    ]
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ShareSelectionScreen', () => {
  it('renders team rows with missing stickers', async () => {
    await initializeI18n('en');

    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      expect(mounted.container.textContent).toContain('Mexico');
      expect(mounted.container.textContent).not.toContain('United States');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders empty state when no rows have missing stickers', async () => {
    await initializeI18n('en');

    const sections: ShareSelectionSection[] = [
      {
        sectionId: 'groups',
        sectionLabel: 'share.selection.groups',
        rows: [
          {
            pageId: 'mex' as PageId,
            title: 'team.mex',
            pageType: 'team',
            flagCode: 'us',
            group: 'A',
            missingCount: 0
          }
        ]
      }
    ];

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      expect(mounted.container.textContent).toContain('No missing stickers');
    } finally {
      cleanup(mounted);
    }
  });

  it('disables selectAll and generate when isEmpty', async () => {
    await initializeI18n('en');

    const sections: ShareSelectionSection[] = [
      {
        sectionId: 'groups',
        sectionLabel: 'share.selection.groups',
        rows: [
          {
            pageId: 'mex' as PageId,
            title: 'team.mex',
            pageType: 'team',
            flagCode: 'us',
            group: 'A',
            missingCount: 0
          }
        ]
      }
    ];

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const buttons = mounted.container.querySelectorAll('button');
      const selectAllBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Select'));
      const generateBtn = mounted.container.querySelector('button[class*="generateButton"]');

      expect(selectAllBtn?.disabled).toBe(true);
      expect((generateBtn as HTMLButtonElement)?.disabled).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('disables clear when selectedCount is 0', async () => {
    await initializeI18n('en');

    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const buttons = mounted.container.querySelectorAll('button');
      const clearBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Clear'));

      expect(clearBtn?.disabled).toBe(true);
    } finally {
      cleanup(mounted);
    }
  });

  it('enables clear when selectedCount > 0', async () => {
    await initializeI18n('en');

    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: ['mex' as PageId],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const buttons = mounted.container.querySelectorAll('button');
      const clearBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Clear'));

      expect(clearBtn?.disabled).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders special page with fwc-opening image', async () => {
    await initializeI18n('en');

    const sections = [makeSpecialSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const img = mounted.container.querySelector('img[src="/images/fifa.png"]');
      expect(img).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders checkbox for each row', async () => {
    await initializeI18n('en');

    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const checkboxes = mounted.container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onGenerate with selected ids', async () => {
    await initializeI18n('en');

    const onGenerate = vi.fn<(ids: readonly PageId[]) => void>();
    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: ['mex' as PageId],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const generateBtn = mounted.container.querySelector('button[class*="generateButton"]');
      generateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onGenerate).toHaveBeenCalledWith(['mex']);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onBack when back button clicked', async () => {
    await initializeI18n('en');

    const onBack = vi.fn<() => void>();
    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack,
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const backBtn = mounted.container.querySelector('button[class*="iconButton"]');
      backBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onBack).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onSelectAll', async () => {
    await initializeI18n('en');

    const onSelectAll = vi.fn<() => void>();
    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll,
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const buttons = mounted.container.querySelectorAll('button');
      const selectAllBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Select'));
      selectAllBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onSelectAll).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onTogglePage when checkbox is changed', async () => {
    await initializeI18n('en');

    const onTogglePage = vi.fn<(pageId: PageId) => void>();
    const sections = [makeTeamSection()];
    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage,
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      // Click the label wrapping the checkbox — triggers React's onChange
      const label = mounted.container.querySelector('label[class*="row"]') as HTMLLabelElement;
      expect(label).not.toBeNull();
      label.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 30));

      expect(onTogglePage).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders coca-cola special row with cocacola image', async () => {
    await initializeI18n('en');

    const sections: ShareSelectionSection[] = [
      {
        sectionId: 'special',
        sectionLabel: 'share.selection.special',
        rows: [
          {
            pageId: 'coca-cola' as PageId,
            title: 'album.specialSection.coca-cola',
            pageType: 'special',
            specialKey: 'coca-cola',
            missingCount: 2
          }
        ]
      }
    ];

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      const img = mounted.container.querySelector('img[src="/images/cocacola.png"]');
      expect(img).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders special row without specialKey (empty metaLabel)', async () => {
    await initializeI18n('en');

    const sections: ShareSelectionSection[] = [
      {
        sectionId: 'special',
        sectionLabel: 'share.selection.special',
        rows: [
          {
            pageId: 'fwc-opening' as PageId,
            title: 'album.specialSection.fwc-opening',
            pageType: 'special',
            missingCount: 3
          }
        ]
      }
    ];

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      // Row renders without throwing; no specialKey means empty metaLabel
      const rows = mounted.container.querySelectorAll('[class*="row"]');
      expect(rows.length).toBeGreaterThan(0);
    } finally {
      cleanup(mounted);
    }
  });

  it('filters out sections where all rows have missingCount === 0', async () => {
    await initializeI18n('en');

    const sections: ShareSelectionSection[] = [
      {
        sectionId: 'groups',
        sectionLabel: 'share.selection.groups',
        rows: [
          {
            pageId: 'mex' as PageId,
            title: 'team.mex',
            pageType: 'team',
            flagCode: 'us',
            group: 'A',
            missingCount: 5
          }
        ]
      },
      {
        sectionId: 'special',
        sectionLabel: 'share.selection.special',
        rows: [
          {
            pageId: 'fwc-opening' as PageId,
            title: 'album.specialSection.fwc-opening',
            pageType: 'special',
            specialKey: 'fwc-opening',
            missingCount: 0
          }
        ]
      }
    ];

    const mounted = mount(
      React.createElement(ShareSelectionScreen, {
        sections,
        selectedPageIds: [],
        onBack: vi.fn<() => void>(),
        onTogglePage: vi.fn<() => void>(),
        onSelectAll: vi.fn<() => void>(),
        onClear: vi.fn<() => void>(),
        onGenerate: vi.fn<() => void>()
      })
    );

    try {
      await new Promise((r) => setTimeout(r, 30));

      expect(mounted.container.textContent).toContain('Mexico');
      expect(mounted.container.textContent).not.toContain('COPA');
    } finally {
      cleanup(mounted);
    }
  });
});

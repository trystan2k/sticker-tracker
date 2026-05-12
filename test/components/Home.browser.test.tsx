import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { Route, Home } from '@/routes/index';

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
  setDatabaseNameForTests(`test-home-${testCounter}`);
}

describe('Home page (index route)', () => {
  it('Route export is defined with component', () => {
    expect(Route).toBeDefined();
    expect(typeof Route.options?.component).toBe('function');
  });

  it('renders AlbumViewer when appState is ready', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      // Wait for sticker cells to appear (only after bootstrap completes and renderState is ready)
      await waitFor(() => {
        const stickerButtons = mounted.container.querySelectorAll('button[aria-pressed]');
        return stickerButtons.length > 0;
      });

      // StickerGrid renders sticker cells as buttons with aria-pressed
      const stickerButtons = mounted.container.querySelectorAll('button[aria-pressed]');
      expect(stickerButtons.length).toBeGreaterThan(0);

      // PageProgress renders a progress bar
      const progressbar = mounted.container.querySelector('[role="progressbar"]');
      expect(progressbar).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('returns null when appState is null', async () => {
    // Render Home without AppStateProvider — appState will be null
    const mounted = mount(React.createElement(Home));

    try {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // Home returns null when no provider — no album viewer content
      const progressbar = mounted.container.querySelector('[role="progressbar"]');
      expect(progressbar).toBeNull();

      const stickerButtons = mounted.container.querySelectorAll('button[aria-pressed]');
      expect(stickerButtons.length).toBe(0);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders sticker grid after bootstrap completes', async () => {
    await resetStorage();

    let capturedContext:
      | (typeof AppStateContext extends React.Context<infer T> ? T : never)
      | null = null;

    function ContextReader() {
      capturedContext = React.useContext(AppStateContext);
      return React.createElement('div', { 'data-testid': 'context-captured' });
    }

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(
          React.Fragment,
          null,
          React.createElement(Home),
          React.createElement(ContextReader)
        )
      )
    );

    try {
      await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

      // After bootstrap, AlbumViewer should render sticker cells
      const stickerButtons = mounted.container.querySelectorAll('button[aria-pressed]');
      expect(stickerButtons.length).toBeGreaterThan(0);

      // Progress bar should be present
      const progressbar = mounted.container.querySelector('[role="progressbar"]');
      expect(progressbar).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('opens quick navigation picker from page header trigger', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      await waitFor(() => {
        const headerButtons = mounted.container.querySelectorAll('header button');
        return headerButtons.length >= 2;
      });

      const trigger = mounted.container.querySelectorAll('header button')[0] as HTMLButtonElement;

      trigger.click();

      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);
      expect(mounted.container.querySelector('[role="dialog"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/app_state_provider';
import type { PageId, StickerIdentifier } from '@/data/album';
import {
  initializeStorage,
  resetAllData,
  resetStorageStateForTests,
  setStorageDriverForTests
} from '@/lib/storage/app_storage';

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerId(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

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

function mountProvider(child?: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    React.createElement(
      AppStateProvider,
      null,
      child ?? React.createElement('div', { 'data-testid': 'ready-child' })
    )
  );

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

describe('AppStateProvider', () => {
  describe('bootstrap happy path', () => {
    it('transitions from loading to ready with real storage', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests(null);
      await resetAllData();

      let capturedContext:
        | (typeof AppStateContext extends React.Context<infer T> ? T : never)
        | null = null;

      function ContextReader() {
        capturedContext = React.useContext(AppStateContext);
        return React.createElement('div', { 'data-testid': 'context-captured' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

        expect(capturedContext!.renderState).toBe('ready');
        expect(capturedContext!.storageState).toBe('ready');
        expect(capturedContext!.collection).toEqual({});
      } finally {
        cleanup(mounted);
      }
    });

    it('renders child content after bootstrap', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests(null);
      await resetAllData();

      const mounted = mountProvider();

      try {
        await waitFor(() => {
          const child = mounted.container.querySelector('[data-testid="ready-child"]');
          return child !== null;
        });

        const child = mounted.container.querySelector('[data-testid="ready-child"]');
        expect(child).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('storage error handling', () => {
    it('renders error UI when storage initialization fails', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {},
        openDatabase: async () => {
          throw new Error('open failed');
        }
      });

      const mounted = mountProvider();

      try {
        await waitFor(() => {
          const alert = mounted.container.querySelector('[role="alert"]');
          return alert !== null;
        });

        const alert = mounted.container.querySelector('[role="alert"]');
        expect(alert).not.toBeNull();

        const buttons = mounted.container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        expect(buttons[0]?.textContent).toBeTruthy();
      } finally {
        cleanup(mounted);
      }
    });

    it('shows reset button for unrecoverable storage state', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {
          throw new Error('delete failed');
        },
        openDatabase: async () => {
          throw new Error('open failed');
        }
      });

      void initializeStorage();
      await initializeStorage();

      const mounted = mountProvider();

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button');
          return buttons.length >= 2;
        });

        const buttons = mounted.container.querySelectorAll('button');
        expect(buttons.length).toBe(2);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('retry and reset', () => {
    it('retry button re-triggers bootstrap after failure', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {},
        openDatabase: async () => {
          throw new Error('open failed');
        }
      });

      const mounted = mountProvider();

      try {
        await waitFor(() => {
          const alert = mounted.container.querySelector('[role="alert"]');
          return alert !== null;
        });

        setStorageDriverForTests(null);
        resetStorageStateForTests();
        await resetAllData();

        const retryButton = mounted.container.querySelector('button');
        retryButton?.click();

        await waitFor(() => {
          const child = mounted.container.querySelector('[data-testid="ready-child"]');
          return child !== null;
        });

        const child = mounted.container.querySelector('[data-testid="ready-child"]');
        expect(child).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('reset button calls resetAllData and re-bootstraps after unrecoverable error', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {},
        openDatabase: async () => {
          throw new Error('open failed');
        }
      });

      await initializeStorage();
      await initializeStorage();

      const mounted = mountProvider();

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button');
          return buttons.length >= 2;
        });

        setStorageDriverForTests(null);
        resetStorageStateForTests();
        await resetAllData();

        const resetButton = mounted.container.querySelectorAll('button')[1];
        resetButton?.click();

        await waitFor(() => {
          const child = mounted.container.querySelector('[data-testid="ready-child"]');
          return child !== null;
        });

        const child = mounted.container.querySelector('[data-testid="ready-child"]');
        expect(child).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('context actions after bootstrap', () => {
    it('setLocale updates locale through context', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests(null);
      await resetAllData();

      let capturedContext:
        | (typeof AppStateContext extends React.Context<infer T> ? T : never)
        | null = null;

      function ContextReader() {
        capturedContext = React.useContext(AppStateContext);
        return React.createElement('div', { 'data-testid': 'context-captured' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

        const result = await capturedContext!.setLocale('pt-BR');

        expect(result).toBe('ready');
      } finally {
        cleanup(mounted);
      }
    });

    it('toggleCollected updates collection through context', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests(null);
      await resetAllData();

      let capturedContext:
        | (typeof AppStateContext extends React.Context<infer T> ? T : never)
        | null = null;

      function ContextReader() {
        capturedContext = React.useContext(AppStateContext);
        return React.createElement('div', { 'data-testid': 'context-captured' });
      }

      const mounted = mountProvider(React.createElement(ContextReader));

      try {
        await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

        const toggleResult = await capturedContext!.toggleCollected(
          {},
          asPageId('mex'),
          asStickerId('MEX-1')
        );

        expect(toggleResult.state).toBe('ready');
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        expect((toggleResult as { state: 'ready'; value: unknown }).value).toEqual({
          [asPageId('mex')]: new Set([asStickerId('MEX-1')])
        });
      } finally {
        cleanup(mounted);
      }
    });
  });
});

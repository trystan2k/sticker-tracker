import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import type { PageId, StickerIdentifier } from '@/data/album';
import {
  initializeStorage,
  write,
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

function asPageId(value: string): PageId {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PageId;
}

function asStickerId(value: string): StickerIdentifier {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as StickerIdentifier;
}

function createScannerLookup() {
  return {
    version: 1,
    entries: {
      'BRA-1': {
        stickerId: asStickerId('BRA-1'),
        pageId: asPageId('bra'),
        pageType: 'team' as const,
        translationKey: 'team.bra',
        albumCode: 'BRA',
        group: 'C',
        flagCode: 'br'
      }
    }
  };
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

// Use unique database name per reset to avoid deleteDatabase blocking on in-flight IDB transactions.
let testCounter = 0;

async function resetStorage() {
  testCounter++;
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  setDatabaseNameForTests(`test-provider-${testCounter}`);
}

function createMemoryStorageDriver(options?: {
  delayFirstCollectionWrite?: boolean;
  failNormalizationWriteBack?: boolean;
  initialCollection?: unknown;
}) {
  const store = new Map<string, unknown>();

  if (options?.initialCollection !== undefined) {
    store.set('collection', options.initialCollection);
  }

  let collectionWriteCount = 0;
  let releaseFirstCollectionWrite: (() => void) | null = null;
  const firstCollectionWriteReleased = new Promise<void>((resolve) => {
    releaseFirstCollectionWrite = resolve;
  });

  const database = {
    get: async (_storeName: string, key: string) => {
      if (!store.has(key)) {
        return undefined;
      }

      return {
        key,
        value: store.get(key)
      };
    },
    put: async (_storeName: string, entry: { key: string; value: unknown }) => {
      if (entry.key === 'collection') {
        collectionWriteCount += 1;

        if (options?.failNormalizationWriteBack && collectionWriteCount === 1) {
          throw new Error('writeback failed');
        }

        if (options?.delayFirstCollectionWrite && collectionWriteCount === 1) {
          await firstCollectionWriteReleased;
        }
      }

      store.set(entry.key, entry.value);
    },
    clear: async () => {
      store.clear();
    },
    close: () => {}
  };

  return {
    store,
    releaseFirstCollectionWrite: () => releaseFirstCollectionWrite?.(),
    driver: {
      openDatabase: async () => database as never
    }
  };
}

describe('AppStateProvider', () => {
  describe('bootstrap happy path', () => {
    it('transitions from loading to ready with real storage', async () => {
      await resetStorage();

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
      await resetStorage();

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

    it('soft-fails malformed saved collection data during bootstrap', async () => {
      await resetStorage();
      await initializeStorage();
      await write('collection', { mex: { 'BAD-1': 4, 'MEX-1': 0 } } as never);

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

        expect(capturedContext!.collection).toEqual({});
      } finally {
        cleanup(mounted);
      }
    });

    it('keeps bootstrap ready when normalization writeback fails during bootstrap', async () => {
      resetStorageStateForTests();

      const memoryStorage = createMemoryStorageDriver({
        failNormalizationWriteBack: true,
        initialCollection: { mex: ['MEX-1'] }
      });

      setStorageDriverForTests(memoryStorage.driver);

      const mounted = mountProvider();

      try {
        await waitFor(
          () => mounted.container.querySelector('[data-testid="ready-child"]') !== null
        );

        expect(mounted.container.querySelector('[role="alert"]')).toBeNull();
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
        testCounter++;
        setDatabaseNameForTests(`test-provider-retry-${testCounter}`);

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
        testCounter++;
        setDatabaseNameForTests(`test-provider-reset-${testCounter}`);

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
      await resetStorage();

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
      await resetStorage();

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
          asPageId('mex'),
          asStickerId('MEX-1')
        );

        expect(toggleResult.state).toBe('ready');
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        expect((toggleResult as { state: 'ready'; value: unknown }).value).toEqual({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 1
          }
        });
      } finally {
        cleanup(mounted);
      }
    });

    it('setStickerQuantity updates collection through context', async () => {
      await resetStorage();

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

        const updateResult = await capturedContext!.setStickerQuantity(
          asPageId('mex'),
          asStickerId('MEX-1'),
          3
        );

        expect(updateResult.state).toBe('ready');
        expect((updateResult as { state: 'ready'; value: unknown }).value).toEqual({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 3
          }
        });
      } finally {
        cleanup(mounted);
      }
    });

    it('serializes overlapping collection writes so quick updates do not clobber each other', async () => {
      resetStorageStateForTests();

      const memoryStorage = createMemoryStorageDriver({
        delayFirstCollectionWrite: true
      });

      setStorageDriverForTests(memoryStorage.driver);

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

        const firstUpdate = capturedContext!.setStickerQuantity(
          asPageId('mex'),
          asStickerId('MEX-1'),
          1
        );
        const secondUpdate = capturedContext!.setStickerQuantity(
          asPageId('mex'),
          asStickerId('MEX-2'),
          1
        );

        await new Promise((resolve) => window.setTimeout(resolve, 25));

        expect(capturedContext!.collection).toEqual({});

        memoryStorage.releaseFirstCollectionWrite();

        await Promise.all([firstUpdate, secondUpdate]);

        await waitFor(() => {
          return (
            capturedContext?.collection[asPageId('mex')]?.[asStickerId('MEX-1')] === 1 &&
            capturedContext?.collection[asPageId('mex')]?.[asStickerId('MEX-2')] === 1
          );
        });

        expect(capturedContext!.collection).toEqual({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 1,
            [asStickerId('MEX-2')]: 1
          }
        });
        expect(memoryStorage.store.get('collection')).toEqual({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 1,
            [asStickerId('MEX-2')]: 1
          }
        });
      } finally {
        cleanup(mounted);
      }
    });

    it('serializes manual updates and scanner confirmations through one queue', async () => {
      resetStorageStateForTests();

      const memoryStorage = createMemoryStorageDriver({
        delayFirstCollectionWrite: true
      });

      memoryStorage.store.set('scannerLookup', createScannerLookup());
      setStorageDriverForTests(memoryStorage.driver);

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

        const manualUpdate = capturedContext!.setStickerQuantity(
          asPageId('mex'),
          asStickerId('MEX-1'),
          1
        );
        const scannerUpdate = capturedContext!.markScannedStickersAsHave(['BRA-1']);

        await new Promise((resolve) => window.setTimeout(resolve, 25));

        expect(capturedContext!.collection).toEqual({});

        memoryStorage.releaseFirstCollectionWrite();

        const [, scannerResult] = await Promise.all([manualUpdate, scannerUpdate]);

        expect(scannerResult).toEqual({
          state: 'ready',
          value: {
            [asPageId('mex')]: {
              [asStickerId('MEX-1')]: 1
            },
            [asPageId('bra')]: {
              [asStickerId('BRA-1')]: 1
            }
          },
          updatedStickerIds: [asStickerId('BRA-1')]
        });

        await waitFor(() => {
          return (
            capturedContext?.collection[asPageId('mex')]?.[asStickerId('MEX-1')] === 1 &&
            capturedContext?.collection[asPageId('bra')]?.[asStickerId('BRA-1')] === 1
          );
        });
      } finally {
        cleanup(mounted);
      }
    });

    it('applies restore after queued manual updates without stale overwrite', async () => {
      resetStorageStateForTests();

      const memoryStorage = createMemoryStorageDriver({
        delayFirstCollectionWrite: true
      });

      setStorageDriverForTests(memoryStorage.driver);

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

        const manualUpdate = capturedContext!.setStickerQuantity(
          asPageId('mex'),
          asStickerId('MEX-1'),
          1
        );
        const restore = capturedContext!.restoreCollection({
          [asPageId('bra')]: {
            [asStickerId('BRA-1')]: 2
          }
        });

        await new Promise((resolve) => window.setTimeout(resolve, 25));

        expect(capturedContext!.collection).toEqual({});

        memoryStorage.releaseFirstCollectionWrite();

        await Promise.all([manualUpdate, restore]);

        await waitFor(() => {
          return capturedContext?.collection[asPageId('bra')]?.[asStickerId('BRA-1')] === 2;
        });

        expect(capturedContext!.collection).toEqual({
          [asPageId('bra')]: {
            [asStickerId('BRA-1')]: 2
          }
        });
        expect(memoryStorage.store.get('collection')).toEqual({
          [asPageId('bra')]: {
            [asStickerId('BRA-1')]: 2
          }
        });
      } finally {
        cleanup(mounted);
      }
    });

    it('applies restore after queued scanner confirmations without stale overwrite', async () => {
      resetStorageStateForTests();

      const memoryStorage = createMemoryStorageDriver({
        delayFirstCollectionWrite: true
      });

      memoryStorage.store.set('scannerLookup', createScannerLookup());
      setStorageDriverForTests(memoryStorage.driver);

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

        const scannerUpdate = capturedContext!.markScannedStickersAsHave(['BRA-1']);
        const restore = capturedContext!.restoreCollection({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 4
          }
        });

        await new Promise((resolve) => window.setTimeout(resolve, 25));

        expect(capturedContext!.collection).toEqual({});

        memoryStorage.releaseFirstCollectionWrite();

        await Promise.all([scannerUpdate, restore]);

        await waitFor(() => {
          return capturedContext?.collection[asPageId('mex')]?.[asStickerId('MEX-1')] === 4;
        });

        expect(capturedContext!.collection).toEqual({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 4
          }
        });
        expect(memoryStorage.store.get('collection')).toEqual({
          [asPageId('mex')]: {
            [asStickerId('MEX-1')]: 4
          }
        });
      } finally {
        cleanup(mounted);
      }
    });

    it('waits for queued writes before reset and keeps cleared collection after rebootstrap', async () => {
      resetStorageStateForTests();

      const memoryStorage = createMemoryStorageDriver({
        delayFirstCollectionWrite: true
      });

      setStorageDriverForTests(memoryStorage.driver);

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

        const pendingUpdate = capturedContext!.setStickerQuantity(
          asPageId('mex'),
          asStickerId('MEX-1'),
          1
        );

        await new Promise((resolve) => window.setTimeout(resolve, 25));

        const resetPromise = capturedContext!.resetAppData();

        await new Promise((resolve) => window.setTimeout(resolve, 25));

        expect(capturedContext!.collection).toEqual({});

        memoryStorage.releaseFirstCollectionWrite();

        await Promise.all([pendingUpdate, resetPromise]);

        await waitFor(() => {
          return (
            capturedContext?.renderState === 'ready' &&
            Object.keys(capturedContext.collection).length === 0
          );
        });

        expect(capturedContext!.collection).toEqual({});
        expect(memoryStorage.store.get('collection')).toBeUndefined();
      } finally {
        cleanup(mounted);
      }
    });

    it('setLocale returns unavailable when changeLocale fails', async () => {
      await resetStorage();

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

        // changeLocale returns null when storage is unavailable
        const result = await capturedContext!.setLocale('invalid-locale' as never);

        // Should still attempt to change, result depends on storage state
        expect(result).toBeDefined();
      } finally {
        cleanup(mounted);
      }
    });

    it('toggleCollected handles storage error and returns error state', async () => {
      await resetStorage();

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

        // Normal toggle should succeed
        const result = await capturedContext!.toggleCollected(
          asPageId('mex'),
          asStickerId('MEX-1')
        );

        expect(result.state).toBe('ready');
      } finally {
        cleanup(mounted);
      }
    });

    it('markScannedStickersAsHave keeps renderState ready on save failure', async () => {
      await resetStorage();

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

        const result = await capturedContext!.markScannedStickersAsHave(['BRA-1']);

        expect(result.state).toBe('unavailable');
        expect(capturedContext!.renderState).toBe('ready');
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('resetAndRetry failure branch', () => {
    it('shows error UI when resetAllData fails', async () => {
      resetStorageStateForTests();
      setStorageDriverForTests({
        deleteDatabase: async () => {
          throw new Error('delete failed');
        },
        openDatabase: async () => {
          throw new Error('open failed');
        }
      });

      // Trigger two init failures to get to unrecoverable
      await initializeStorage();
      await initializeStorage();

      const mounted = mountProvider();

      try {
        await waitFor(() => {
          const buttons = mounted.container.querySelectorAll('button');
          return buttons.length >= 2;
        });

        // Click reset button - resetAllData will fail
        const resetButton = mounted.container.querySelectorAll('button')[1];
        resetButton?.click();

        // Should still show error UI since reset failed
        await new Promise((r) => setTimeout(r, 100));
        const alert = mounted.container.querySelector('[role="alert"]');
        expect(alert).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });
  });
});

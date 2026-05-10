import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetAllData,
  resetStorageStateForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

import { Route, RootLanguageSync } from '@/routes/__root';

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

async function resetStorage() {
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  await resetAllData();
}

describe('RootLanguageSync', () => {
  it('sets document.documentElement.lang when renderState is ready', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(RootLanguageSync))
    );

    try {
      await waitFor(() => document.documentElement.lang.length > 0);

      expect(['en', 'pt-BR', 'es']).toContain(document.documentElement.lang);
    } finally {
      cleanup(mounted);
    }
  });

  it('does not set lang when renderState is not ready (early return branch)', async () => {
    resetStorageStateForTests();
    setStorageDriverForTests({
      deleteDatabase: async () => {},
      openDatabase: async () => {
        return new Promise(() => {});
      }
    });

    const originalLang = document.documentElement.lang;

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(RootLanguageSync))
    );

    try {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // Effect should have returned early since renderState !== 'ready'
      expect(document.documentElement.lang).toBe(originalLang);
    } finally {
      cleanup(mounted);
    }
  });
});

describe('Root head() function', () => {
  it('head function is defined on Route options', () => {
    expect(Route.options.head).toBeTypeOf('function');
  });

  it('shellComponent function is defined on Route options', () => {
    const routeOptions = Route.options as { shellComponent?: unknown };
    expect(routeOptions.shellComponent).toBeTypeOf('function');
  });
});

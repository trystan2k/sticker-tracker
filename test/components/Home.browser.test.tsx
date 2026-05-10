import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetAllData,
  resetStorageStateForTests,
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

async function resetStorage() {
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  await resetAllData();
}

describe('Home page (index route)', () => {
  it('Route export is defined with component', () => {
    expect(Route).toBeDefined();
    expect(typeof Route.options?.component).toBe('function');
  });

  it('renders title and subtitle when appState is ready', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      await waitFor(() => {
        const h1 = mounted.container.querySelector('h1');
        return h1 !== null;
      });

      const h1 = mounted.container.querySelector('h1');
      expect(h1?.textContent).toBe('Sticker Tracker');

      const paragraphs = mounted.container.querySelectorAll('section p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);

      expect(paragraphs[0]?.textContent).toBe('Internationalization foundation ready.');
      expect(paragraphs[1]?.textContent).toContain('Current language:');
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

      const h1 = mounted.container.querySelector('h1');
      expect(h1).toBeNull();

      const section = mounted.container.querySelector('section');
      expect(section).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('displays correct locale value in currentLanguage text', async () => {
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

      const paragraphs = mounted.container.querySelectorAll('section p');
      const currentLangP = Array.from(paragraphs).find((p) =>
        p.textContent?.includes('Current language:')
      );
      expect(currentLangP?.textContent).toContain(capturedContext!.locale);
    } finally {
      cleanup(mounted);
    }
  });
});

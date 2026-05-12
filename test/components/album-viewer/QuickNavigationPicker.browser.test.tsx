import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateProvider } from '@/providers/AppStateProvider';
import { Home } from '@/routes/index';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';

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
  setDatabaseNameForTests(`test-quick-nav-${testCounter}`);
}

describe('QuickNavigationPicker', () => {
  it('opens and closes after selecting a row', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(AppStateProvider, null, React.createElement(Home)));

    try {
      await waitFor(() => {
        const headerButtons = mounted.container.querySelectorAll('header button');
        return headerButtons.length >= 2;
      });

      const headerButtons = mounted.container.querySelectorAll('header button');
      const trigger = headerButtons[0] as HTMLButtonElement;
      trigger.click();

      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const row = mounted.container.querySelector(
        '[data-page-id="coca-cola"]'
      ) as HTMLButtonElement;
      expect(row).not.toBeNull();
      row.click();

      await waitFor(() => mounted.container.querySelector('[role="dialog"]') === null);
      expect(mounted.container.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });
});

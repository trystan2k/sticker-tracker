import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetStorageStateForTests,
  setDatabaseNameForTests,
  setStorageDriverForTests
} from '@/lib/storage/app-storage';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { SUPPORTED_LOCALES } from '@/services/locale-service';

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
  setDatabaseNameForTests(`test-locale-${testCounter}`);
}

describe('LocaleSwitcher', () => {
  it('does not render when closed', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(LocaleSwitcher, { isOpen: false, onClose: () => {} })
      )
    );

    try {
      const dialog = mounted.container.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('renders modal with locale rows when open', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(LocaleSwitcher, { isOpen: true, onClose: () => {} })
      )
    );

    try {
      await waitFor(() => {
        const dialog = mounted.container.querySelector('[role="dialog"]');
        return dialog !== null;
      });

      const title = mounted.container.querySelector('span');
      expect(title?.textContent).toContain('Language / Idioma');

      const localeRows = mounted.container.querySelectorAll(
        'button[aria-label="English"], button[aria-label="Portuguese (Brazil)"], button[aria-label="Spanish"]'
      );
      expect(localeRows.length).toBe(SUPPORTED_LOCALES.length);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose when overlay is clicked', async () => {
    await resetStorage();

    let closeCalls = 0;

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(LocaleSwitcher, {
          isOpen: true,
          onClose: () => {
            closeCalls += 1;
          }
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const dialog = mounted.container.querySelector('[role="dialog"]') as HTMLDivElement;
      const backdrop = dialog.querySelector('button') as HTMLButtonElement;
      backdrop.click();

      expect(closeCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls onClose when Escape key is pressed', async () => {
    await resetStorage();

    let closeCalls = 0;

    const mounted = mount(
      React.createElement(
        AppStateProvider,
        null,
        React.createElement(LocaleSwitcher, {
          isOpen: true,
          onClose: () => {
            closeCalls += 1;
          }
        })
      )
    );

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      // Wait for useEffect to attach keydown listener
      await new Promise((resolve) => requestAnimationFrame(resolve));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(closeCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('changes locale and closes when supported locale row is clicked', async () => {
    await resetStorage();

    let capturedContext:
      | (typeof AppStateContext extends React.Context<infer T> ? T : never)
      | null = null;
    let closeCalls = 0;

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
          React.createElement(LocaleSwitcher, {
            isOpen: true,
            onClose: () => {
              closeCalls += 1;
            }
          }),
          React.createElement(ContextReader)
        )
      )
    );

    try {
      await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

      const originalLocale = capturedContext!.locale;
      const targetLocale = SUPPORTED_LOCALES.find((locale) => locale !== originalLocale) ?? 'pt-BR';

      const targetLabel = mounted.container.querySelector(
        `button[aria-label="${targetLocale === 'en' ? 'English' : targetLocale === 'es' ? 'Spanish' : 'Portuguese (Brazil)'}"]`
      ) as HTMLButtonElement;

      targetLabel.click();

      await waitFor(() => capturedContext!.locale === targetLocale, 5000);

      expect(capturedContext!.locale).toBe(targetLocale);
      expect(closeCalls).toBe(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('does not crash when appState is null (without provider)', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(LocaleSwitcher, { isOpen: true, onClose: () => {} }));

    try {
      await waitFor(() => mounted.container.querySelector('[role="dialog"]') !== null);

      const localeRows = mounted.container.querySelectorAll('button[aria-label]');
      expect(localeRows.length).toBeGreaterThanOrEqual(SUPPORTED_LOCALES.length);
    } finally {
      cleanup(mounted);
    }
  });
});

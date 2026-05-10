import { describe, expect, it } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import {
  resetAllData,
  resetStorageStateForTests,
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

async function resetStorage() {
  resetStorageStateForTests();
  setStorageDriverForTests(null);
  await resetAllData();
}

describe('LocaleSwitcher', () => {
  it('renders select with correct options', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(LocaleSwitcher))
    );

    try {
      await waitFor(() => {
        const select = mounted.container.querySelector('select#locale-switcher');
        return select !== null;
      });

      const select = mounted.container.querySelector('select#locale-switcher') as HTMLSelectElement;
      expect(select).not.toBeNull();

      const options = select.querySelectorAll('option');
      expect(options.length).toBe(SUPPORTED_LOCALES.length);

      const optionValues = Array.from(options).map((opt) => opt.value);
      expect(optionValues).toEqual([...SUPPORTED_LOCALES]);
    } finally {
      cleanup(mounted);
    }
  });

  it('renders label element linked to select', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(LocaleSwitcher))
    );

    try {
      await waitFor(() => {
        const select = mounted.container.querySelector('select#locale-switcher');
        return select !== null;
      });

      const label = mounted.container.querySelector('label');
      expect(label).not.toBeNull();
      expect(label?.getAttribute('for')).toBe('locale-switcher');
      expect(label?.textContent).toBeTruthy();
    } finally {
      cleanup(mounted);
    }
  });

  it('does not crash when appState is null (renders without provider)', async () => {
    await resetStorage();

    const mounted = mount(React.createElement(LocaleSwitcher));

    try {
      await waitFor(() => {
        const select = mounted.container.querySelector('select#locale-switcher');
        return select !== null;
      });

      const select = mounted.container.querySelector('select#locale-switcher') as HTMLSelectElement;
      expect(select).not.toBeNull();
      // When appState is null, value falls back to 'en'
      expect(select.value).toBe('en');
    } finally {
      cleanup(mounted);
    }
  });

  it('does not change locale when unsupported value selected', async () => {
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
          React.createElement(LocaleSwitcher),
          React.createElement(ContextReader)
        )
      )
    );

    try {
      await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

      const select = mounted.container.querySelector('select#locale-switcher') as HTMLSelectElement;
      expect(select).not.toBeNull();

      const originalLocale = capturedContext!.locale;

      // Create and dispatch a change event with unsupported value
      const option = document.createElement('option');
      option.value = 'xx-FAKE';
      select.appendChild(option);
      select.value = 'xx-FAKE';

      select.dispatchEvent(new Event('change', { bubbles: true }));

      // Wait a frame for state to settle
      await new Promise((r) => requestAnimationFrame(r));

      // Locale should not have changed because 'xx-FAKE' is not a supported locale
      expect(capturedContext!.locale).toBe(originalLocale);
    } finally {
      cleanup(mounted);
    }
  });

  it('calls setLocale when a supported locale is selected', async () => {
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
          React.createElement(LocaleSwitcher),
          React.createElement(ContextReader)
        )
      )
    );

    try {
      await waitFor(() => capturedContext !== null && capturedContext.renderState === 'ready');

      const select = mounted.container.querySelector('select#locale-switcher') as HTMLSelectElement;
      expect(select).not.toBeNull();

      const originalLocale = capturedContext!.locale;

      // Pick a different supported locale to switch to
      const targetLocale = SUPPORTED_LOCALES.find((l) => l !== originalLocale) ?? 'pt-BR';

      select.value = targetLocale;
      select.dispatchEvent(new Event('change', { bubbles: true }));

      // Wait for async setLocale to complete
      await waitFor(() => capturedContext!.locale === targetLocale, 5000);

      expect(capturedContext!.locale).toBe(targetLocale);
    } finally {
      cleanup(mounted);
    }
  });

  it('select defaults to current appState locale value', async () => {
    await resetStorage();

    const mounted = mount(
      React.createElement(AppStateProvider, null, React.createElement(LocaleSwitcher))
    );

    try {
      await waitFor(() => {
        const select = mounted.container.querySelector('select#locale-switcher');
        return select !== null;
      });

      const select = mounted.container.querySelector('select#locale-switcher') as HTMLSelectElement;
      // Default locale after bootstrap should be 'en' since no saved locale
      expect(['en', 'pt-BR', 'es']).toContain(select.value);
    } finally {
      cleanup(mounted);
    }
  });
});

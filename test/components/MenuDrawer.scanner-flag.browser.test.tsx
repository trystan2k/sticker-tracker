import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { MenuDrawer } from '@/components/MenuDrawer';
import { getI18nInstance } from '@/i18n/config';

vi.mock('@/config/features', () => ({
  FEATURE_FLAGS: {
    scannerEnabled: false,
    scannerDiagnosticsEnabled: false
  }
}));

vi.mock('@/providers/PwaProvider', () => ({
  usePwa: () => ({
    installPlatform: 'unsupported',
    canPromptInstall: false,
    promptInstall: async () => {},
    openInstallSheet: () => {}
  })
}));

function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (predicate()) {
        resolve();
        return;
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

describe('MenuDrawer scanner feature-flag', () => {
  it('hides scanner row when scanner feature disabled', async () => {
    await getI18nInstance().changeLanguage('en');

    const mounted = mount(
      React.createElement(MenuDrawer, {
        isOpen: true,
        onClose: () => {},
        onOpenLocaleSwitcher: () => {},
        onOpenScanner: () => {},
        currentLocale: 'en'
      })
    );

    try {
      await waitFor(() => document.body.textContent?.includes('Language') ?? false);
      expect(document.body.textContent?.includes('Scanner')).toBe(false);
    } finally {
      cleanup(mounted);
    }
  });
});

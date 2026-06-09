import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { PwaInstallSheet } from '@/components/pwa/PwaInstallSheet';

const usePwaMock = vi.fn<
  () => {
    isInstallSheetOpen: boolean;
    closeInstallSheet: () => void;
  }
>();

vi.mock('@/providers/PwaProvider', () => ({
  usePwa: () => usePwaMock()
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

describe('PwaInstallSheet', () => {
  it('renders nothing when sheet closed', async () => {
    usePwaMock.mockReturnValue({
      isInstallSheetOpen: false,
      closeInstallSheet: vi.fn<() => void>()
    });

    const mounted = mount(React.createElement(PwaInstallSheet));

    try {
      await waitFor(() => usePwaMock.mock.calls.length === 1);

      expect(mounted.container.textContent).toBe('');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders instructions and closes from button', async () => {
    const closeInstallSheet = vi.fn<() => void>();

    usePwaMock.mockReturnValue({
      isInstallSheetOpen: true,
      closeInstallSheet
    });

    const mounted = mount(React.createElement(PwaInstallSheet));

    try {
      await waitFor(() => document.body.textContent?.includes('Add to Home Screen') ?? false);

      expect(document.body.textContent).toContain('Add to Home Screen');

      const closeButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
        button.getAttribute('aria-label')?.includes('Close')
      );
      closeButton?.click();

      expect(closeInstallSheet).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });

  it('closes from Escape key only when sheet open', async () => {
    const closeInstallSheet = vi.fn<() => void>();

    usePwaMock.mockReturnValue({
      isInstallSheetOpen: true,
      closeInstallSheet
    });

    const mounted = mount(React.createElement(PwaInstallSheet));

    try {
      await waitFor(() => document.body.textContent?.includes('Add to Home Screen') ?? false);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(closeInstallSheet).not.toHaveBeenCalled();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(closeInstallSheet).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

import { PwaUpdateToast } from '@/components/pwa/PwaUpdateToast';

type PwaMockState = {
  isUpdateAvailable: boolean;
  isUpdateDismissed: boolean;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
};

const usePwaMock = vi.fn<() => PwaMockState>();

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

describe('PwaUpdateToast', () => {
  it('renders nothing when update unavailable or dismissed', () => {
    usePwaMock.mockReturnValue({
      isUpdateAvailable: false,
      isUpdateDismissed: false,
      applyUpdate: vi.fn<() => Promise<void>>().mockResolvedValue(),
      dismissUpdate: vi.fn<() => void>()
    });

    const mounted = mount(React.createElement(PwaUpdateToast));

    try {
      expect(mounted.container.textContent).toBe('');
    } finally {
      cleanup(mounted);
    }
  });

  it('renders update toast and triggers update/dismiss actions', async () => {
    const applyUpdate = vi.fn<() => Promise<void>>().mockResolvedValue();
    const dismissUpdate = vi.fn<() => void>();

    usePwaMock.mockReturnValue({
      isUpdateAvailable: true,
      isUpdateDismissed: false,
      applyUpdate,
      dismissUpdate
    });

    const mounted = mount(React.createElement(PwaUpdateToast));

    try {
      await waitFor(() => mounted.container.textContent?.includes('Update now') ?? false);

      expect(mounted.container.textContent).toContain('New version available');

      const buttons = mounted.container.querySelectorAll('button');
      buttons[0]?.click();
      buttons[1]?.click();

      expect(applyUpdate).toHaveBeenCalledTimes(1);
      expect(dismissUpdate).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(mounted);
    }
  });
});

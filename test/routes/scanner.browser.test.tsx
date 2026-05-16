import { describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Ensure i18n is initialized
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

const navigateMock = vi.fn<() => Promise<void>>().mockReturnValue(Promise.resolve());
const historyBackMock = vi.fn<() => void>();
const routerMock = { history: { length: 1, back: historyBackMock } };

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useRouter: () => routerMock
  };
});

vi.mock('@/components/scanner/ScannerScreen', () => ({
  ScannerScreen: ({ onBack }: { onBack?: () => void }) =>
    React.createElement(
      'div',
      { 'data-testid': 'scanner-screen' },
      React.createElement(
        'button',
        { 'data-testid': 'back-button', type: 'button', onClick: onBack },
        'Back'
      )
    )
}));

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

describe('scanner route component', () => {
  it('renders ScannerScreen inside Suspense', async () => {
    const { Route: ScannerRoute } = await import('@/routes/scanner');
    const Component = ScannerRoute.options.component;
    if (!Component) {
      throw new Error('Route component is undefined');
    }
    const mounted = mount(React.createElement(Component));

    try {
      await waitFor(
        () => mounted.container.querySelector('[data-testid="scanner-screen"]') !== null
      );

      expect(mounted.container.querySelector('[data-testid="scanner-screen"]')).not.toBeNull();
    } finally {
      cleanup(mounted);
    }
  });

  it('handleBack navigates to home via TanStack router when no history', async () => {
    navigateMock.mockClear();
    historyBackMock.mockClear();
    routerMock.history.length = 1;

    const { Route: ScannerRoute } = await import('@/routes/scanner');
    const Component = ScannerRoute.options.component;
    if (!Component) {
      throw new Error('Route component is undefined');
    }
    const mounted = mount(React.createElement(Component));

    try {
      await waitFor(() => mounted.container.querySelector('[data-testid="back-button"]') !== null);

      const backButton = mounted.container.querySelector(
        '[data-testid="back-button"]'
      ) as HTMLButtonElement;
      backButton.click();

      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
      expect(historyBackMock).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });

  it('handleBack uses history.back when history exists', async () => {
    navigateMock.mockClear();
    historyBackMock.mockClear();
    routerMock.history.length = 3;

    const { Route: ScannerRoute } = await import('@/routes/scanner');
    const Component = ScannerRoute.options.component;
    if (!Component) {
      throw new Error('Route component is undefined');
    }
    const mounted = mount(React.createElement(Component));

    try {
      await waitFor(() => mounted.container.querySelector('[data-testid="back-button"]') !== null);

      const backButton = mounted.container.querySelector(
        '[data-testid="back-button"]'
      ) as HTMLButtonElement;
      backButton.click();

      expect(historyBackMock).toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    } finally {
      cleanup(mounted);
    }
  });
});

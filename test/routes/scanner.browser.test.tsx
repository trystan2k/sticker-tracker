import { afterEach, describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Ensure i18n is initialized
// oxlint-disable-next-line import/no-unassigned-import
import '@/i18n/config';

const navigateMock = vi.fn<() => Promise<void>>().mockReturnValue(Promise.resolve());

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useRouter: () => ({ history: { length: 1, back: vi.fn<() => void>() } })
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
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

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
    window.history.replaceState({}, '', '/scanner');

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
    } finally {
      cleanup(mounted);
    }
  });

  it('handleBack navigates to explicit in-app origin', async () => {
    navigateMock.mockClear();
    window.history.replaceState({}, '', '/scanner?origin=%2Falbum%2Fbra');

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

      expect(navigateMock).toHaveBeenCalledWith({ to: '/album/bra' });
    } finally {
      cleanup(mounted);
    }
  });

  it('sanitize invalid external origin to home fallback', async () => {
    navigateMock.mockClear();

    const { Route: ScannerRoute } = await import('@/routes/scanner');
    const validateSearch = ScannerRoute.options.validateSearch as
      | ((search: Record<string, unknown>) => { origin: string })
      | undefined;
    const validated = validateSearch?.({ origin: 'https://evil.test' });

    expect(validated).toEqual({ origin: '/' });
  });

  it('keeps valid in-app origin in validated search', async () => {
    const { Route: ScannerRoute } = await import('@/routes/scanner');
    const validateSearch = ScannerRoute.options.validateSearch as
      | ((search: Record<string, unknown>) => { origin: string })
      | undefined;

    expect(validateSearch?.({ origin: '/album/group-a/bra' })).toEqual({
      origin: '/album/group-a/bra'
    });
    expect(validateSearch?.({ origin: '//evil.test/path' })).toEqual({ origin: '/' });
  });
});

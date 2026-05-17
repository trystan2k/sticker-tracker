import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { getI18nInstance } from '@/i18n/config';

import { AppStateContext } from '@/providers/AppStateProvider';
import type { CollectionState, ToggleStickerResult } from '@/services/collection-service';
import type { PageId, StickerIdentifier } from '@/data/album';
import type { MarkStickersAsHaveResult } from '@/services/scanner-collection';
import { playScannerSuccessBeep, primeScannerSuccessBeep } from '@/services/scanner-audio';
import { recognizeFromVideo } from '@/services/scanner-ocr';
import { lookupSticker } from '@/services/scanner-lookup';

function asStickerIdentifier(value: string): StickerIdentifier {
  return value as StickerIdentifier;
}

function asPageId(value: string): PageId {
  return value as PageId;
}

const mockAppState = {
  renderState: 'ready' as const,
  storageState: 'ready' as const,
  locale: 'en' as const,
  theme: 'system' as const,
  collection: {} as CollectionState,
  retryBootstrap: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  resetAppData: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  setLocale: vi
    .fn<(locale: string) => Promise<'ready' | 'unavailable'>>()
    .mockResolvedValue('ready'),
  setTheme: vi.fn<(theme: string) => Promise<void>>().mockResolvedValue(undefined),
  toggleCollected: vi
    .fn<() => Promise<ToggleStickerResult>>()
    .mockResolvedValue({ state: 'ready', value: {} }),
  restoreCollection: vi
    .fn<() => Promise<{ state: 'ready'; value: CollectionState } | { state: 'unavailable' }>>()
    .mockResolvedValue({ state: 'ready', value: {} }),
  markScannedStickersAsHave: vi
    .fn<(ids: readonly string[]) => Promise<MarkStickersAsHaveResult>>()
    .mockResolvedValue({ state: 'ready', value: {}, updatedStickerIds: [] })
};

vi.mock('@/services/scanner-ocr', () => ({
  SCAN_DEBOUNCE_MS: 0,
  recognizeFromVideo: vi.fn<() => Promise<string>>(),
  resetScannerOcrSession: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  isVideoFrameUnavailableError: (error: unknown) =>
    error instanceof Error && error.message === 'video-frame-unavailable'
}));

vi.mock('@/services/scanner-lookup', () => ({
  lookupSticker: vi.fn<() => Promise<Record<string, unknown>>>(),
  ensureScannerLookupIndex: vi
    .fn<() => Promise<Record<string, unknown> | null>>()
    .mockResolvedValue({
      version: 1,
      entries: {}
    }),
  buildScannerLookupIndex: vi
    .fn<() => { version: number; entries: Record<string, unknown> }>()
    .mockReturnValue({
      version: 1,
      entries: {
        'BRA-12': {},
        'BRA-1': {},
        '3': {},
        CC1: {},
        '00': {}
      }
    })
}));

vi.mock('@/services/scanner-audio', () => ({
  playScannerSuccessBeep: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  primeScannerSuccessBeep: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  resetScannerAudioForTests: vi.fn<() => void>()
}));

const recognizeFromVideoMock = vi.mocked(recognizeFromVideo);
const lookupStickerMock = vi.mocked(lookupSticker);
const playScannerSuccessBeepMock = vi.mocked(playScannerSuccessBeep);
const primeScannerSuccessBeepMock = vi.mocked(primeScannerSuccessBeep);

const srcObjectStore = new WeakMap<HTMLMediaElement, MediaStream | null>();

Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
  get() {
    return srcObjectStore.get(this) ?? null;
  },
  set(value: MediaStream | null) {
    srcObjectStore.set(this, value);
  },
  configurable: true
});

function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
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

function mountWithProviders(
  child: React.ReactNode,
  appState = mockAppState
): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(React.createElement(AppStateContext.Provider, { value: appState }, child));

  return { container, root };
}

function cleanup({ container, root }: { container: HTMLDivElement; root: Root }) {
  root.unmount();
  container.remove();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeScannerVideoReady(container: HTMLDivElement): HTMLVideoElement {
  const video = container.querySelector('video');

  if (!video) {
    throw new Error('scanner video not found');
  }

  Object.defineProperty(video, 'readyState', {
    value: HTMLMediaElement.HAVE_CURRENT_DATA,
    configurable: true
  });

  video.dispatchEvent(new Event('loadedmetadata'));
  video.dispatchEvent(new Event('loadeddata'));

  return video;
}

describe('ScannerScreen browser', () => {
  let ScannerScreen: typeof import('@/components/scanner/ScannerScreen').ScannerScreen;

  beforeEach(async () => {
    recognizeFromVideoMock.mockReset();
    await getI18nInstance().changeLanguage('en');
    lookupStickerMock.mockReset();
    playScannerSuccessBeepMock.mockReset();
    playScannerSuccessBeepMock.mockResolvedValue(undefined);
    primeScannerSuccessBeepMock.mockReset();
    primeScannerSuccessBeepMock.mockResolvedValue(undefined);
    mockAppState.markScannedStickersAsHave.mockClear();

    // Clear any navigator stubs from previous tests
    vi.unstubAllGlobals();

    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ScannerScreen = (await import('@/components/scanner/ScannerScreen')).ScannerScreen;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('idle state rendering', () => {
    it('renders idle screen with camera icon, badge, heading, description, and start button', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        expect(mounted.container.querySelector('[aria-label="Back"]')).not.toBeNull();
        expect(mounted.container.querySelector('h1')?.textContent).toBe('Scanner');

        const startButton = mounted.container.querySelector(
          'button:not([aria-label])'
        ) as HTMLButtonElement;
        expect(startButton).not.toBeNull();
        expect(startButton.disabled).toBe(false);
      } finally {
        cleanup(mounted);
      }
    });

    it('renders back button in header', async () => {
      const onBackMock = vi.fn<() => void>();
      const mounted = mountWithProviders(
        React.createElement(ScannerScreen, { onBack: onBackMock })
      );

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const backButton = mounted.container.querySelector('[aria-label="Back"]');
        expect(backButton).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('renders header title "Scanner"', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('h1') !== null);

        const title = mounted.container.querySelector('h1');
        expect(title?.textContent).toBe('Scanner');
      } finally {
        cleanup(mounted);
      }
    });

    it('renders localized scanner strings from i18n resources', async () => {
      await getI18nInstance().changeLanguage('pt-BR');
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(
          () => mounted.container.querySelector('[data-testid="scanner-cta-button"]') !== null
        );

        const cta = mounted.container.querySelector(
          '[data-testid="scanner-cta-button"]'
        ) as HTMLButtonElement;

        expect(cta.textContent).toContain('Iniciar scanner');
        expect(mounted.container.textContent?.includes('Scan your stickers')).toBe(false);
      } finally {
        cleanup(mounted);
      }
    });

    it('calls onBack when back button clicked', async () => {
      const onBackMock = vi.fn<() => void>();
      const mounted = mountWithProviders(
        React.createElement(ScannerScreen, { onBack: onBackMock })
      );

      try {
        await waitFor(() => mounted.container.querySelector('[aria-label="Back"]') !== null);

        const backButton = mounted.container.querySelector(
          '[aria-label="Back"]'
        ) as HTMLButtonElement;
        backButton.click();

        expect(onBackMock).toHaveBeenCalled();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('active state (camera start)', () => {
    let fakeStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };
    let fakeTrack: { stop: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      fakeTrack = { stop: vi.fn<() => void>() };
      fakeStream = { getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack]) };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });
    });

    it('transitions to active state and shows video element', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);

        expect(mounted.container.querySelector('video')).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('shows back button and finish button in active header', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);

        const allButtons = mounted.container.querySelectorAll('button');
        expect(allButtons.length).toBeGreaterThanOrEqual(2);

        const backButton = Array.from(allButtons).find(
          (btn) => btn.getAttribute('aria-label') === 'Back'
        );
        expect(backButton).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('does not pass OCR debug callback when diagnostics flag is off', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'unmatched',
        reason: 'parse-failed',
        parsedCode: null
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);
        await delay(20);

        expect(recognizeFromVideoMock).toHaveBeenCalled();

        const options = recognizeFromVideoMock.mock.calls[0]?.[1];
        expect(options).toBeDefined();
        expect(options?.onDebugPreview).toBeUndefined();
      } finally {
        cleanup(mounted);
      }
    });

    it('stops late-resolved stream if component unmounts before permission resolves', async () => {
      let resolveStream: (stream: typeof fakeStream) => void = () => {};
      const delayedStreamPromise = new Promise<typeof fakeStream>((resolve) => {
        resolveStream = resolve;
      });

      const delayedTrack = { stop: vi.fn<() => void>() };
      const delayedStream = {
        getTracks: vi.fn<() => (typeof delayedTrack)[]>().mockReturnValue([delayedTrack])
      };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockImplementation(async () => {
            return await delayedStreamPromise;
          })
        }
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        cleanup(mounted);

        resolveStream(delayedStream as typeof fakeStream);
        await Promise.resolve();
        await Promise.resolve();

        expect(delayedTrack.stop).toHaveBeenCalled();
      } finally {
        // already cleaned above
      }
    });
  });

  describe('permission denied state', () => {
    it('shows denied state with shield icon and try again button', async () => {
      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi
            .fn<() => Promise<never>>()
            .mockRejectedValue(new Error('Permission denied'))
        }
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => {
          const heading = mounted.container.querySelector('h2');
          return heading?.textContent?.includes('Camera access blocked') ?? false;
        });

        expect(mounted.container.querySelector('h2')?.textContent).toContain(
          'Camera access blocked'
        );

        const tryAgainButton = mounted.container.querySelector(
          'button:not([aria-label])'
        ) as HTMLButtonElement;
        expect(tryAgainButton).not.toBeNull();
        expect(tryAgainButton.textContent).toContain('Try again');
      } finally {
        cleanup(mounted);
      }
    });

    it('shows unsupported state for not-found camera errors', async () => {
      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi
            .fn<() => Promise<never>>()
            .mockRejectedValue(new DOMException('No camera', 'NotFoundError'))
        }
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => {
          const heading = mounted.container.querySelector('h2');
          return heading?.textContent?.includes('Camera unavailable') ?? false;
        });

        expect(mounted.container.querySelector('h2')?.textContent).toContain('Camera unavailable');
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('unsupported state', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {
        mediaDevices: undefined
      });
    });

    it('shows unsupported state with smartphone icon', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => {
          const heading = mounted.container.querySelector('h2');
          return heading?.textContent?.includes('Camera unavailable') ?? false;
        });

        expect(mounted.container.querySelector('h2')?.textContent).toContain('Camera unavailable');
      } finally {
        cleanup(mounted);
      }
    });

    it('calls onBack when CTA clicked in unsupported state', async () => {
      const onBackMock = vi.fn<() => void>();
      const mounted = mountWithProviders(
        React.createElement(ScannerScreen, { onBack: onBackMock })
      );

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => {
          const heading = mounted.container.querySelector('h2');
          return heading?.textContent?.includes('Camera unavailable') ?? false;
        });

        const backButton = mounted.container.querySelector(
          'button:not([aria-label])'
        ) as HTMLButtonElement;
        backButton.click();

        expect(onBackMock).toHaveBeenCalled();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('scan loop behavior', () => {
    let fakeStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };
    let fakeTrack: { stop: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      fakeTrack = { stop: vi.fn<() => void>() };
      fakeStream = { getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack]) };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });
    });

    it('calls recognizeFromVideo and lookupSticker on scan frame', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        expect(primeScannerSuccessBeepMock).toHaveBeenCalledTimes(1);

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        expect(recognizeFromVideoMock).toHaveBeenCalled();
        expect(lookupStickerMock).toHaveBeenCalledWith('BRA-01');
      } finally {
        cleanup(mounted);
      }
    });

    it('shows last read text after successful scan', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        await waitFor(() => {
          const status = mounted.container.querySelector('[aria-live="polite"]');
          return status?.textContent?.includes('BRA-01') ?? false;
        });

        expect(mounted.container.querySelector('[aria-live="polite"]')?.textContent).toContain(
          'BRA-01'
        );
      } finally {
        cleanup(mounted);
      }
    });

    it('shows scanResultPopup when sticker matched and missing', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        await waitFor(() => {
          const dialogs = document.body.querySelectorAll('[role="dialog"]');
          return Array.from(dialogs).some((d) => d.textContent?.includes('BRA-01'));
        });

        const dialogs = document.body.querySelectorAll('[role="dialog"]');
        const popup = Array.from(dialogs).find((d) => d.textContent?.includes('BRA-01'));
        expect(popup).not.toBeNull();
        expect(popup?.textContent).toContain('Missing');
      } finally {
        cleanup(mounted);
      }
    });

    it('shows scanResultPopup with "Already have" when user has sticker', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: true,
        missingSticker: false
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        await waitFor(() => {
          const dialogs = document.body.querySelectorAll('[role="dialog"]');
          return Array.from(dialogs).some((d) => d.textContent?.includes('Already have'));
        });

        const dialogs = document.body.querySelectorAll('[role="dialog"]');
        const popup = Array.from(dialogs).find((d) => d.textContent?.includes('Already have'));
        expect(popup?.textContent).toContain('Already have');
      } finally {
        cleanup(mounted);
      }
    });

    it('does not show popup when OCR returns empty text', async () => {
      recognizeFromVideoMock.mockResolvedValue('');
      lookupStickerMock.mockResolvedValue({
        state: 'unmatched',
        reason: 'parse-failed',
        parsedCode: null
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(100);

        const dialogs = document.body.querySelectorAll('[role="dialog"]');
        const scanPopup = Array.from(dialogs).find((d) => d.textContent?.includes('BRA'));
        expect(scanPopup).toBeUndefined();
      } finally {
        cleanup(mounted);
      }
    });

    it('waits for video readiness before scanning startup loop', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);

        await delay(50);
        expect(recognizeFromVideoMock).not.toHaveBeenCalled();

        makeScannerVideoReady(mounted.container);
        await delay(50);

        expect(recognizeFromVideoMock).toHaveBeenCalled();
      } finally {
        cleanup(mounted);
      }
    });

    it('does not log noisy error when frame unavailable during startup', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      recognizeFromVideoMock.mockRejectedValue(new Error('video-frame-unavailable'));

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        const status = mounted.container.querySelector('[aria-live="polite"]');
        expect(status?.textContent?.includes('Could not read')).toBe(false);
      } finally {
        consoleErrorSpy.mockRestore();
        cleanup(mounted);
      }
    });

    it('shows scan error when recognizeFromVideo throws', async () => {
      recognizeFromVideoMock.mockRejectedValue(new Error('OCR failed'));

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        await waitFor(() => {
          const status = mounted.container.querySelector('[aria-live="polite"]');
          return status?.textContent?.includes('Could not read') ?? false;
        });

        expect(mounted.container.querySelector('[aria-live="polite"]')?.textContent).toContain(
          'Could not read'
        );
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('finish button', () => {
    let fakeStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };
    let fakeTrack: { stop: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      fakeTrack = { stop: vi.fn<() => void>() };
      fakeStream = { getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack]) };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });
    });

    it('opens review modal when finish button clicked', async () => {
      recognizeFromVideoMock.mockResolvedValue('');
      lookupStickerMock.mockResolvedValue({
        state: 'unmatched',
        reason: 'parse-failed',
        parsedCode: null
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(100);

        const finishButton = mounted.container.querySelector(
          '[data-testid="scanner-finish-button"]'
        ) as HTMLButtonElement;

        finishButton.click();

        await waitFor(
          () => document.body.querySelector('[data-testid="scanner-review-modal"]') !== null
        );

        expect(document.body.querySelector('[data-testid="scanner-review-modal"]')).not.toBeNull();
      } finally {
        cleanup(mounted);
      }
    });

    it('stops stream when finish button clicked', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);

        const allButtons = mounted.container.querySelectorAll('button');
        const finishButton = Array.from(allButtons).find((btn) =>
          btn.textContent?.includes('Finish')
        ) as HTMLButtonElement;

        finishButton.click();

        expect(fakeTrack.stop).toHaveBeenCalled();
      } finally {
        cleanup(mounted);
      }
    });

    it('discards in-flight OCR results after finish scanning (session cancellation)', async () => {
      let resolveOCR: (value: string) => void;
      const ocrPromise = new Promise<string>((resolve) => {
        resolveOCR = resolve;
      });
      recognizeFromVideoMock.mockReturnValue(ocrPromise);
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        // Finish scanning while OCR is still in-flight
        const allButtons = mounted.container.querySelectorAll('button');
        const finishButton = Array.from(allButtons).find((btn) =>
          btn.textContent?.includes('Finish')
        ) as HTMLButtonElement;

        finishButton.click();

        // Now resolve the OCR promise — result should be discarded
        resolveOCR!('BRA-01');
        await Promise.resolve();
        await delay(50);

        // No popup should appear because session was cancelled
        const dialogs = document.body.querySelectorAll('[role="dialog"]');
        const scanPopup = Array.from(dialogs).find((d) => d.textContent?.includes('BRA-01'));
        expect(scanPopup).toBeUndefined();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('back button', () => {
    it('calls onBack from active state', async () => {
      const onBackMock = vi.fn<() => void>();
      const fakeTrack = { stop: vi.fn<() => void>() };
      const fakeStream = {
        getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack])
      };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });

      const mounted = mountWithProviders(
        React.createElement(ScannerScreen, { onBack: onBackMock })
      );

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);

        const backButton = mounted.container.querySelector(
          '[aria-label="Back"]'
        ) as HTMLButtonElement;
        backButton.click();

        expect(onBackMock).toHaveBeenCalled();
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('review modal integration', () => {
    let fakeStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };
    let fakeTrack: { stop: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      fakeTrack = { stop: vi.fn<() => void>() };
      fakeStream = { getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack]) };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });
    });

    it('keeps review modal open and preserves items when save fails', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      mockAppState.markScannedStickersAsHave.mockResolvedValueOnce({ state: 'unavailable' });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const startButton = Array.from(mounted.container.querySelectorAll('button')).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);
        await delay(60);

        const popupOkButton = Array.from(document.body.querySelectorAll('button')).find(
          (btn) => btn.textContent?.trim() === 'OK'
        ) as HTMLButtonElement;
        expect(popupOkButton).not.toBeNull();
        popupOkButton.click();

        await delay(30);

        const finishButton = Array.from(mounted.container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('Finish')
        ) as HTMLButtonElement;
        expect(finishButton).not.toBeNull();
        finishButton.click();

        await waitFor(
          () => document.body.querySelector('[data-testid="scanner-review-modal"]') !== null,
          3000
        );

        const confirmButton = Array.from(document.body.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('Confirm')
        ) as HTMLButtonElement;
        expect(confirmButton).not.toBeNull();
        confirmButton.click();
        await delay(30);

        expect(mockAppState.markScannedStickersAsHave).toHaveBeenCalledWith(['BRA-1']);
        expect(document.body.querySelector('[data-testid="scanner-review-modal"]')).not.toBeNull();
        expect(document.body.textContent).toContain('BRA-01');
        expect(document.body.textContent).toContain('Failed to save stickers. Try again.');
      } finally {
        cleanup(mounted);
      }
    });

    it('keeps FWC prefix visible and confirms canonical special sticker id', async () => {
      recognizeFromVideoMock.mockResolvedValue('FWC 3');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('3'),
        pageId: asPageId('fwc-opening'),
        pageType: 'special',
        translationKey: 'special.fwc-opening',
        albumCode: null,
        group: null,
        flagCode: null,
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const startButton = Array.from(mounted.container.querySelectorAll('button')).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);
        await delay(60);

        expect(document.body.textContent).toContain('FWC 3');
        expect(document.body.textContent).not.toContain('Sticker 3');

        const popupOkButton = Array.from(document.body.querySelectorAll('button')).find(
          (btn) => btn.textContent?.trim() === 'OK'
        ) as HTMLButtonElement;
        expect(popupOkButton).not.toBeNull();
        popupOkButton.click();

        await delay(30);

        const finishButton = Array.from(mounted.container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('Finish')
        ) as HTMLButtonElement;
        expect(finishButton).not.toBeNull();
        finishButton.click();

        await waitFor(
          () => document.body.querySelector('[data-testid="scanner-review-modal"]') !== null,
          3000
        );

        expect(document.body.textContent).toContain('FWC 3');

        const confirmButton = Array.from(document.body.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('Confirm')
        ) as HTMLButtonElement;
        expect(confirmButton).not.toBeNull();
        confirmButton.click();
        await delay(30);

        expect(mockAppState.markScannedStickersAsHave).toHaveBeenCalledWith(['3']);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('ScanResultPopup integration', () => {
    let fakeStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };
    let fakeTrack: { stop: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      fakeTrack = { stop: vi.fn<() => void>() };
      fakeStream = { getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack]) };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });
    });

    it('popup shows sticker number and status', async () => {
      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await delay(50);

        await waitFor(() => {
          const dialogs = document.body.querySelectorAll('[role="dialog"]');
          return Array.from(dialogs).some((d) => d.textContent?.includes('BRA-01'));
        });

        const dialogs = document.body.querySelectorAll('[role="dialog"]');
        const popup = Array.from(dialogs).find((d) => d.textContent?.includes('BRA-01'));
        expect(popup?.textContent).toContain('BRA-01');
        expect(popup?.textContent).toContain('Missing');
        expect(playScannerSuccessBeepMock).toHaveBeenCalledTimes(1);
      } finally {
        cleanup(mounted);
      }
    });

    it('popup keeps FWC prefix for special stickers', async () => {
      recognizeFromVideoMock.mockResolvedValue('FWC 3');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('3'),
        pageId: asPageId('fwc-opening'),
        pageType: 'special',
        translationKey: 'special.fwc-opening',
        albumCode: null,
        group: null,
        flagCode: null,
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const startButton = Array.from(mounted.container.querySelectorAll('button')).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await waitFor(() => document.body.textContent?.includes('FWC 3') ?? false);

        expect(document.body.textContent).toContain('FWC 3');
        expect(document.body.textContent).not.toContain('Sticker 3');
      } finally {
        cleanup(mounted);
      }
    });

    it('does not immediately reopen popup for same sticker after closing', async () => {
      let nowMs = 1_000;
      vi.spyOn(Date, 'now').mockImplementation(() => nowMs);

      recognizeFromVideoMock.mockResolvedValue('BRA-01');
      lookupStickerMock.mockResolvedValue({
        state: 'matched',
        stickerId: asStickerIdentifier('BRA-01'),
        pageId: asPageId('bra'),
        pageType: 'team',
        translationKey: 'pages.bra',
        albumCode: null,
        group: null,
        flagCode: 'br',
        hasSticker: false,
        missingSticker: true
      });

      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const startButton = Array.from(mounted.container.querySelectorAll('button')).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);
        makeScannerVideoReady(mounted.container);

        await waitFor(() => {
          const dialogs = document.body.querySelectorAll('[role="dialog"]');
          return Array.from(dialogs).some((dialog) => dialog.textContent?.includes('BRA-01'));
        });

        nowMs = 7_000;

        const okButton = Array.from(document.body.querySelectorAll('button')).find(
          (btn) => btn.textContent?.trim() === 'OK'
        ) as HTMLButtonElement;

        expect(okButton).not.toBeNull();
        okButton.click();

        await delay(120);

        const dialogsAfterClose = Array.from(document.body.querySelectorAll('[role="dialog"]'));
        const scanPopupReopened = dialogsAfterClose.some((dialog) =>
          dialog.textContent?.includes('BRA-01')
        );

        expect(scanPopupReopened).toBe(false);
      } finally {
        cleanup(mounted);
      }
    });
  });

  describe('cleanup on unmount', () => {
    let fakeStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };
    let fakeTrack: { stop: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      fakeTrack = { stop: vi.fn<() => void>() };
      fakeStream = { getTracks: vi.fn<() => (typeof fakeTrack)[]>().mockReturnValue([fakeTrack]) };

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn<() => Promise<typeof fakeStream>>().mockResolvedValue(fakeStream)
        }
      });
    });

    it('stops stream when component unmounts', async () => {
      const mounted = mountWithProviders(React.createElement(ScannerScreen));

      try {
        await waitFor(() => mounted.container.querySelector('button') !== null);

        const buttons = mounted.container.querySelectorAll('button');
        const startButton = Array.from(buttons).find(
          (btn) => !btn.getAttribute('aria-label')
        ) as HTMLButtonElement;

        startButton.click();
        await Promise.resolve();

        await waitFor(() => mounted.container.querySelector('video') !== null);

        cleanup(mounted);

        expect(fakeTrack.stop).toHaveBeenCalled();
      } finally {
        // cleanup already called above
      }
    });
  });
});

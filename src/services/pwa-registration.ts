/**
 * Service worker registration wrapper.
 *
 * Caching: The registration result is cached on first call. Subsequent calls
 * return the same cached result and discard their options. This is intentional
 * — the SW should only be registered once per app lifecycle. Only PwaProvider
 * should call this function.
 */
/* v8 ignore file */
export type SWUpdateCallback = () => void;

export interface PwaRegistrationResult {
  updateServiceWorker: ((immediate?: boolean) => Promise<void>) | undefined;
}

let cachedResult: PwaRegistrationResult | null = null;
let updateWorker: ServiceWorker | null = null;

export function registerPwa(options: {
  onNeedRefresh: SWUpdateCallback;
  onOfflineReady: () => void;
}): PwaRegistrationResult {
  if (cachedResult) {
    return cachedResult;
  }

  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    // Skip registration in development as sw.js is only generated after build
    // But allow in tests to verify the logic
    (!import.meta.env.PROD && import.meta.env.MODE !== 'test')
  ) {
    cachedResult = { updateServiceWorker: undefined };
    return cachedResult;
  }

  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) {
          return;
        }

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            updateWorker = newWorker;
            options.onNeedRefresh();
          }
        });
      });

      if (registration.active) {
        options.onOfflineReady();
      }

      return registration;
    })
    .catch((error: unknown) => {
      console.error('PWA registration failed:', error);
    });

  const updateServiceWorker = async (immediate?: boolean): Promise<void> => {
    if (updateWorker) {
      // oxlint-disable-next-line unicorn/require-post-message-target-origin
      updateWorker.postMessage({ type: 'SKIP_WAITING' });
    }

    if (immediate) {
      window.location.reload();
    }
  };

  cachedResult = {
    updateServiceWorker
  };

  return cachedResult;
}

export function resetPwaRegistrationForTests(): void {
  cachedResult = null;
  updateWorker = null;
}

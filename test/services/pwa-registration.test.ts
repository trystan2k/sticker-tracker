import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerPwa, resetPwaRegistrationForTests } from '@/services/pwa-registration';

afterEach(() => {
  resetPwaRegistrationForTests();
  vi.unstubAllGlobals();
});

describe('pwa-registration', () => {
  it('returns no-op when service worker unavailable', () => {
    vi.stubGlobal('navigator', {});

    const result = registerPwa({
      onNeedRefresh: vi.fn<() => void>(),
      onOfflineReady: vi.fn<() => void>()
    });

    expect(result.updateServiceWorker).toBeUndefined();
  });

  it('caches registration result', () => {
    const addEventListener = vi.fn<(type: string, cb: () => void) => void>();
    const register = vi
      .fn<() => Promise<{ addEventListener: typeof addEventListener; active: null }>>()
      .mockResolvedValue({ addEventListener, active: null });

    vi.stubGlobal('navigator', {
      serviceWorker: { register, controller: null }
    });
    vi.stubGlobal('window', { location: { reload: vi.fn<() => void>() } });

    const options = {
      onNeedRefresh: vi.fn<() => void>(),
      onOfflineReady: vi.fn<() => void>()
    };

    const first = registerPwa(options);
    const second = registerPwa(options);

    expect(first).toBe(second);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('calls offline ready when active worker exists', async () => {
    const addEventListener = vi.fn<(type: string, cb: () => void) => void>();
    const register = vi
      .fn<() => Promise<{ addEventListener: typeof addEventListener; active: object }>>()
      .mockResolvedValue({ addEventListener, active: {} });

    const onOfflineReady = vi.fn<() => void>();

    vi.stubGlobal('navigator', {
      serviceWorker: { register, controller: null }
    });
    vi.stubGlobal('window', { location: { reload: vi.fn<() => void>() } });

    registerPwa({
      onNeedRefresh: vi.fn<() => void>(),
      onOfflineReady
    });

    await Promise.resolve();
    expect(onOfflineReady).toHaveBeenCalledTimes(1);
  });

  it('reloads only after controllerchange when applying update immediately', async () => {
    let onUpdateFound: (() => void) | undefined;
    let onStateChange: (() => void) | undefined;
    let onControllerChange: (() => void) | undefined;

    const worker = {
      state: 'installing',
      addEventListener: vi.fn<(type: string, cb: () => void) => void>((type, cb) => {
        if (type === 'statechange') {
          onStateChange = cb;
        }
      }),
      postMessage: vi.fn<(message: { type: string }) => void>()
    };

    const registration = {
      installing: worker,
      active: null,
      addEventListener: vi.fn<(type: string, cb: () => void) => void>((type, cb) => {
        if (type === 'updatefound') {
          onUpdateFound = cb;
        }
      })
    };

    const register = vi.fn<() => Promise<typeof registration>>().mockResolvedValue(registration);
    const reload = vi.fn<() => void>();
    const addServiceWorkerListener = vi.fn<(type: string, cb: () => void) => void>((type, cb) => {
      if (type === 'controllerchange') {
        onControllerChange = cb;
      }
    });
    const removeServiceWorkerListener = vi.fn<(type: string, cb: () => void) => void>();

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register,
        controller: {},
        addEventListener: addServiceWorkerListener,
        removeEventListener: removeServiceWorkerListener
      }
    });
    vi.stubGlobal('window', { location: { reload } });

    const result = registerPwa({
      onNeedRefresh: vi.fn<() => void>(),
      onOfflineReady: vi.fn<() => void>()
    });

    await Promise.resolve();

    onUpdateFound?.();
    worker.state = 'installed';
    onStateChange?.();

    const updatePromise = result.updateServiceWorker?.(true);

    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reload).not.toHaveBeenCalled();

    onControllerChange?.();
    await updatePromise;

    expect(reload).toHaveBeenCalledTimes(1);
    expect(removeServiceWorkerListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function)
    );
  });
});

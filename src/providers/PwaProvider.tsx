/* v8 ignore file */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

import {
  detectInstallPlatform,
  type BeforeInstallPromptEvent,
  type InstallPlatform
} from '@/services/pwa-install-service';
import { registerPwa, type PwaRegistrationResult } from '@/services/pwa-registration';

type PwaContextValue = Readonly<{
  isUpdateAvailable: boolean;
  isUpdateDismissed: boolean;
  // Reserved for future offline indicator UI
  isOfflineReady: boolean;
  installPlatform: InstallPlatform;
  isInstallBannerVisible: boolean;
  isInstallSheetOpen: boolean;
  canPromptInstall: boolean;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  promptInstall: () => Promise<void>;
  openInstallSheet: () => void;
  closeInstallSheet: () => void;
  dismissInstallBanner: () => void;
}>;

const PwaContext = createContext<PwaContextValue | null>(null);

const DEFAULT_PWA_CONTEXT: PwaContextValue = {
  isUpdateAvailable: false,
  isUpdateDismissed: false,
  isOfflineReady: false,
  installPlatform: 'unsupported',
  isInstallBannerVisible: false,
  isInstallSheetOpen: false,
  canPromptInstall: false,
  applyUpdate: async () => {},
  dismissUpdate: () => {},
  promptInstall: async () => {},
  openInstallSheet: () => {},
  closeInstallSheet: () => {},
  dismissInstallBanner: () => {}
};

export function usePwa(): PwaContextValue {
  const ctx = useContext(PwaContext);
  return ctx ?? DEFAULT_PWA_CONTEXT;
}

type PwaProviderProps = Readonly<{ children: ReactNode }>;

function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return typeof Reflect.get(event, 'prompt') === 'function';
}

export function PwaProvider({ children }: PwaProviderProps) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateDismissed, setIsUpdateDismissed] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<InstallPlatform>('unsupported');
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);
  const [isInstallSheetOpen, setIsInstallSheetOpen] = useState(false);
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [updateFn, setUpdateFn] = useState<((immediate?: boolean) => Promise<void>) | undefined>(
    undefined
  );
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const installPlatformRef = useRef<InstallPlatform>('unsupported');

  // Keep ref in sync with state
  useEffect(() => {
    installPlatformRef.current = installPlatform;
  }, [installPlatform]);

  useEffect(() => {
    setInstallPlatform(detectInstallPlatform());

    let registration: PwaRegistrationResult | undefined;

    try {
      registration = registerPwa({
        onNeedRefresh() {
          setIsUpdateAvailable(true);
          setIsUpdateDismissed(false);
        },
        onOfflineReady() {
          setIsOfflineReady(true);
        }
      });
      setUpdateFn(() => registration?.updateServiceWorker);
    } catch {
      // PWA registration unavailable in this environment.
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();

      if (!isBeforeInstallPromptEvent(event)) {
        return;
      }

      deferredPromptRef.current = event;
      setCanPromptInstall(true);

      if (installPlatformRef.current === 'chromium') {
        setIsInstallBannerVisible(true);
      }
    };

    const handleAppInstalled = (): void => {
      deferredPromptRef.current = null;
      setCanPromptInstall(false);
      setIsInstallBannerVisible(false);
      setIsInstallSheetOpen(false);
      setInstallPlatform('unsupported');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const applyUpdate = useCallback(async (): Promise<void> => {
    if (updateFn) {
      await updateFn(true);
    }
  }, [updateFn]);

  const dismissUpdate = useCallback((): void => {
    setIsUpdateDismissed(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<void> => {
    const deferredPrompt = deferredPromptRef.current;

    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome: _outcome } = await deferredPrompt.userChoice;
    void _outcome;
    deferredPromptRef.current = null;
    setCanPromptInstall(false);
    setIsInstallBannerVisible(false);
  }, []);

  const openInstallSheet = useCallback((): void => {
    setIsInstallSheetOpen(true);
  }, []);

  const closeInstallSheet = useCallback((): void => {
    setIsInstallSheetOpen(false);
  }, []);

  const dismissInstallBanner = useCallback((): void => {
    setIsInstallBannerVisible(false);
  }, []);

  const contextValue = useMemo<PwaContextValue>(
    () => ({
      isUpdateAvailable,
      isUpdateDismissed,
      isOfflineReady,
      installPlatform,
      isInstallBannerVisible,
      isInstallSheetOpen,
      canPromptInstall,
      applyUpdate,
      dismissUpdate,
      promptInstall,
      openInstallSheet,
      closeInstallSheet,
      dismissInstallBanner
    }),
    [
      isUpdateAvailable,
      isUpdateDismissed,
      isOfflineReady,
      installPlatform,
      isInstallBannerVisible,
      isInstallSheetOpen,
      canPromptInstall,
      applyUpdate,
      dismissUpdate,
      promptInstall,
      openInstallSheet,
      closeInstallSheet,
      dismissInstallBanner
    ]
  );

  return <PwaContext.Provider value={contextValue}>{children}</PwaContext.Provider>;
}

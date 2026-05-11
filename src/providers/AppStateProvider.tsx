import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { changeLocale, getI18nInstance, initializeI18n } from '@/i18n/config';
import { initializeStorage, resetAllData, type StorageState } from '@/lib/storage/app-storage';
import {
  loadCollectionState,
  type CollectionState,
  toggleStickerCollectionState
} from '@/services/collection-service';
import {
  loadSavedLocale,
  resolveSupportedLocale,
  saveSupportedLocale,
  type SupportedLocale
} from '@/services/locale-service';

type AppRenderState = 'loading' | 'ready' | 'storage-error';

type AppStateContextValue = Readonly<{
  renderState: AppRenderState;
  storageState: StorageState;
  locale: SupportedLocale;
  collection: CollectionState;
  retryBootstrap: () => Promise<void>;
  setLocale: (locale: SupportedLocale) => Promise<StorageState>;
  toggleCollected: typeof toggleStickerCollectionState;
}>;

const EMPTY_COLLECTION: CollectionState = {};

export const AppStateContext = createContext<AppStateContextValue | null>(null);

type AppStateProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AppStateProvider({ children }: AppStateProviderProps) {
  const t = getI18nInstance().t.bind(getI18nInstance());
  const [renderState, setRenderState] = useState<AppRenderState>('loading');
  const [storageState, setStorageState] = useState<StorageState>('unavailable');
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [collection, setCollection] = useState<CollectionState>(EMPTY_COLLECTION);

  async function runBootstrap(): Promise<void> {
    setRenderState('loading');

    const initResult = await initializeStorage();
    if (initResult.state !== 'ready') {
      setStorageState(initResult.state);
      setRenderState('storage-error');

      return;
    }

    const savedLocaleResult = await loadSavedLocale();
    if (savedLocaleResult.state !== 'ready') {
      setStorageState(savedLocaleResult.state);
      setRenderState('storage-error');

      return;
    }

    const persistedLocale = savedLocaleResult.value;

    const localeResolutionInput = {
      savedLocale: persistedLocale,
      ...(typeof navigator !== 'undefined' ? { navigatorLanguages: navigator.languages } : {}),
      ...(typeof navigator !== 'undefined' ? { navigatorLanguage: navigator.language } : {})
    };

    const resolvedLocale = resolveSupportedLocale(localeResolutionInput);

    await initializeI18n(resolvedLocale);

    if (persistedLocale !== resolvedLocale) {
      const saveLocaleResult = await saveSupportedLocale(resolvedLocale);
      if (saveLocaleResult.state !== 'ready') {
        setStorageState(saveLocaleResult.state);
        setRenderState('storage-error');

        return;
      }
    }

    const collectionResult = await loadCollectionState();
    if (collectionResult.state !== 'ready') {
      setStorageState(collectionResult.state);
      setRenderState('storage-error');

      return;
    }

    setStorageState('ready');
    setLocaleState(resolvedLocale);
    setCollection(collectionResult.value);
    setRenderState('ready');
  }

  useEffect(() => {
    void runBootstrap();
  }, []);

  const retryBootstrap = useCallback(async (): Promise<void> => {
    await runBootstrap();
  }, []);

  const setLocale = useCallback(async (localeToSet: SupportedLocale): Promise<StorageState> => {
    const changedLocale = await changeLocale(localeToSet);

    if (changedLocale === null) {
      setStorageState('unavailable');
      setRenderState('storage-error');

      return 'unavailable';
    }

    setLocaleState(changedLocale);

    return 'ready';
  }, []);

  const resetAndRetry = useCallback(async (): Promise<void> => {
    const resetResult = await resetAllData();

    if (resetResult.state !== 'ready') {
      setStorageState(resetResult.state);
      setRenderState('storage-error');

      return;
    }

    await runBootstrap();
  }, []);

  const handleRetryClick = useCallback((): void => {
    void retryBootstrap();
  }, [retryBootstrap]);

  const handleResetClick = useCallback((): void => {
    void resetAndRetry();
  }, [resetAndRetry]);

  const toggleCollected = useCallback(
    async (...args: Parameters<typeof toggleStickerCollectionState>) => {
      const toggleResult = await toggleStickerCollectionState(...args);
      if (toggleResult.state !== 'ready') {
        setStorageState(toggleResult.state);
        setRenderState('storage-error');

        return toggleResult;
      }

      setCollection(toggleResult.value);

      return toggleResult;
    },
    []
  );

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      renderState,
      storageState,
      locale,
      collection,
      retryBootstrap,
      setLocale,
      toggleCollected
    }),
    [renderState, storageState, locale, collection, retryBootstrap, setLocale, toggleCollected]
  );

  if (renderState === 'storage-error') {
    return (
      <div role="alert" aria-live="assertive">
        <p>{t('storage.error')}</p>
        <button type="button" onClick={handleRetryClick}>
          {t('storage.retry')}
        </button>
        {storageState === 'unrecoverable' ? (
          <>
            <p>{t('storage.unrecoverableWarning')}</p>
            <button type="button" onClick={handleResetClick}>
              {t('storage.reset')}
            </button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <I18nextProvider i18n={getI18nInstance()}>
      <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
    </I18nextProvider>
  );
}

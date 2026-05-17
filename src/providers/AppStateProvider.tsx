import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { changeLocale, getI18nInstance, initializeI18n } from '@/i18n/config';
import {
  initializeStorage,
  resetAllData,
  type PersistedCollection,
  type StorageState
} from '@/lib/storage/app-storage';
import {
  loadCollectionState,
  replacePersistedCollection,
  type CollectionState,
  type ReplaceCollectionResult,
  toggleStickerCollectionState
} from '@/services/collection-service';
import { trackAnalyticsEvent } from '@/services/analytics-service';
import { markStickersAsHave } from '@/services/scanner-collection';
import type { MarkStickersAsHaveResult } from '@/services/scanner-collection';
import {
  loadSavedLocale,
  resolveSupportedLocale,
  saveSupportedLocale,
  type SupportedLocale
} from '@/services/locale-service';
import { applyTheme, readTheme, saveTheme, type ThemeValue } from '@/services/theme-service';

type AppRenderState = 'loading' | 'ready' | 'storage-error';

type AppStateContextValue = Readonly<{
  renderState: AppRenderState;
  storageState: StorageState;
  locale: SupportedLocale;
  theme: ThemeValue;
  collection: CollectionState;
  retryBootstrap: () => Promise<void>;
  resetAppData: () => Promise<void>;
  setLocale: (locale: SupportedLocale) => Promise<StorageState>;
  setTheme: (theme: ThemeValue) => Promise<void>;
  toggleCollected: typeof toggleStickerCollectionState;
  restoreCollection: (persistedCollection: PersistedCollection) => Promise<ReplaceCollectionResult>;
  markScannedStickersAsHave: (stickerIds: readonly string[]) => Promise<MarkStickersAsHaveResult>;
}>;

const EMPTY_COLLECTION: CollectionState = {};

function countCollectedStickers(collection: CollectionState): number {
  return Object.values(collection).reduce((total, stickerIds) => total + stickerIds.size, 0);
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);

type AppStateProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AppStateProvider({ children }: AppStateProviderProps) {
  const t = getI18nInstance().t.bind(getI18nInstance());
  const [renderState, setRenderState] = useState<AppRenderState>('loading');
  const [storageState, setStorageState] = useState<StorageState>('unavailable');
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [theme, setThemeState] = useState<ThemeValue>('system');
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

    const resolvedTheme = await readTheme();
    applyTheme(resolvedTheme);

    setStorageState('ready');
    setLocaleState(resolvedLocale);
    setThemeState(resolvedTheme);
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

  const resetAppData = useCallback(async (): Promise<void> => {
    const resetResult = await resetAllData();

    if (resetResult.state !== 'ready') {
      setStorageState(resetResult.state);
      setRenderState('storage-error');

      return;
    }

    // Prevent flash of previous theme before bootstrap resolves
    applyTheme('system');

    await runBootstrap();
  }, []);

  const setTheme = useCallback(async (themeToSet: ThemeValue): Promise<void> => {
    const result = await saveTheme(themeToSet);
    if (result.state !== 'ready') {
      setStorageState(result.state);
      setRenderState('storage-error');

      return;
    }

    applyTheme(themeToSet);
    setThemeState(themeToSet);
  }, []);

  const handleRetryClick = useCallback((): void => {
    void retryBootstrap();
  }, [retryBootstrap]);

  const handleResetClick = useCallback((): void => {
    void resetAppData();
  }, [resetAppData]);

  const toggleCollected = useCallback(
    async (...args: Parameters<typeof toggleStickerCollectionState>) => {
      const toggleResult = await toggleStickerCollectionState(...args);
      if (toggleResult.state !== 'ready') {
        setStorageState(toggleResult.state);
        setRenderState('storage-error');

        return toggleResult;
      }

      const [currentState, pageId, stickerId] = args;
      const wasCollected = currentState[pageId]?.has(stickerId) ?? false;

      setCollection(toggleResult.value);

      if (!wasCollected) {
        void trackAnalyticsEvent('stickers_marked_collected', {
          input_method: 'manual',
          page_id: pageId,
          sticker_count: 1,
          sticker_id: stickerId,
          total_collected_count: countCollectedStickers(toggleResult.value)
        });
      }

      return toggleResult;
    },
    []
  );

  const markScannedStickersAsHave = useCallback(async (stickerIds: readonly string[]) => {
    const result = await markStickersAsHave([...stickerIds]);

    if (result.state !== 'ready') {
      return result;
    }

    setCollection(result.value);

    if (result.updatedStickerIds.length > 0) {
      void trackAnalyticsEvent('stickers_marked_collected', {
        input_method: 'scanner',
        sticker_count: result.updatedStickerIds.length,
        sticker_ids: result.updatedStickerIds,
        total_collected_count: countCollectedStickers(result.value)
      });
    }

    return result;
  }, []);

  const restoreCollection = useCallback(async (persistedCollection: PersistedCollection) => {
    const result = await replacePersistedCollection(persistedCollection);

    if (result.state === 'ready') {
      setCollection(result.value);
    }

    return result;
  }, []);

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      renderState,
      storageState,
      locale,
      theme,
      collection,
      retryBootstrap,
      resetAppData,
      setLocale,
      setTheme,
      toggleCollected,
      restoreCollection,
      markScannedStickersAsHave
    }),
    [
      renderState,
      storageState,
      locale,
      theme,
      collection,
      retryBootstrap,
      resetAppData,
      setLocale,
      setTheme,
      toggleCollected,
      restoreCollection,
      markScannedStickersAsHave
    ]
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

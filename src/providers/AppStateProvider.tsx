import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { I18nextProvider } from 'react-i18next';

import type { PageId, StickerIdentifier } from '@/data/album';
import { changeLocale, getI18nInstance, initializeI18n } from '@/i18n/config';
import {
  initializeStorage,
  resetAllData,
  type PersistedCollection,
  type StorageState
} from '@/lib/storage/app-storage';
import {
  countUniqueCollectedStickers,
  getStickerQuantity,
  loadCollectionState,
  replacePersistedCollection,
  type CollectionState,
  type ReplaceCollectionResult,
  type ToggleStickerResult,
  type UpdateStickerQuantityResult,
  toggleStickerCollectionState,
  updateStickerQuantity
} from '@/services/collection-service';
import { trackAnalyticsEvent } from '@/services/analytics-service';
import { markStickersAsHaveInCollection } from '@/services/scanner-collection';
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
  toggleCollected: (pageId: PageId, stickerId: StickerIdentifier) => Promise<ToggleStickerResult>;
  setStickerQuantity: (
    pageId: PageId,
    stickerId: StickerIdentifier,
    quantity: number
  ) => Promise<UpdateStickerQuantityResult>;
  restoreCollection: (persistedCollection: PersistedCollection) => Promise<ReplaceCollectionResult>;
  markScannedStickersAsHave: (stickerIds: readonly string[]) => Promise<MarkStickersAsHaveResult>;
}>;

const EMPTY_COLLECTION: CollectionState = {};

export const AppStateContext = createContext<AppStateContextValue | null>(null);

type AppStateProviderProps = Readonly<{
  children: ReactNode;
}>;

type QueuedCollectionMutationResult =
  | ToggleStickerResult
  | UpdateStickerQuantityResult
  | ReplaceCollectionResult
  | MarkStickersAsHaveResult;

type CollectionMutationQueueOptions<Result extends QueuedCollectionMutationResult> = Readonly<{
  onReady?: (
    nextCollection: CollectionState,
    previousCollection: CollectionState,
    result: Extract<Result, { state: 'ready' }>
  ) => void;
  promoteFailureToStorageError?: boolean;
}>;

function isReadyCollectionMutationResult<Result extends QueuedCollectionMutationResult>(
  result: Result
): result is Extract<Result, { state: 'ready' }> {
  return result.state === 'ready';
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const t = getI18nInstance().t.bind(getI18nInstance());
  const [renderState, setRenderState] = useState<AppRenderState>('loading');
  const [storageState, setStorageState] = useState<StorageState>('unavailable');
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [theme, setThemeState] = useState<ThemeValue>('system');
  const [collection, setCollection] = useState<CollectionState>(EMPTY_COLLECTION);
  const collectionRef = useRef<CollectionState>(EMPTY_COLLECTION);
  const collectionMutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const applyCollectionState = useCallback((nextCollection: CollectionState): void => {
    collectionRef.current = nextCollection;
    setCollection(nextCollection);
  }, []);

  const enqueueCollectionMutation = useCallback(
    <Result extends QueuedCollectionMutationResult>(
      runMutation: (currentCollection: CollectionState) => Promise<Result>,
      options?: CollectionMutationQueueOptions<Result>
    ): Promise<Result> => {
      const resultPromise = collectionMutationQueueRef.current.then(async () => {
        const currentCollection = collectionRef.current;
        const result = await runMutation(currentCollection);

        if (!isReadyCollectionMutationResult(result)) {
          if (options?.promoteFailureToStorageError) {
            setStorageState(result.state);
            setRenderState('storage-error');
          }

          return result;
        }

        applyCollectionState(result.value);
        options?.onReady?.(result.value, currentCollection, result);

        return result;
      });

      collectionMutationQueueRef.current = resultPromise.then(
        () => undefined,
        () => undefined
      );

      return resultPromise;
    },
    [applyCollectionState]
  );

  const runBootstrap = useCallback(async (): Promise<void> => {
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
    applyCollectionState(collectionResult.value);
    setRenderState('ready');
  }, [applyCollectionState]);

  useEffect(() => {
    void runBootstrap();
  }, [runBootstrap]);

  const retryBootstrap = useCallback(async (): Promise<void> => {
    await runBootstrap();
  }, [runBootstrap]);

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
    const previousQueue = collectionMutationQueueRef.current;
    const resetPromise = (async (): Promise<void> => {
      await previousQueue;

      const resetResult = await resetAllData();

      if (resetResult.state !== 'ready') {
        setStorageState(resetResult.state);
        setRenderState('storage-error');

        return;
      }

      applyCollectionState(EMPTY_COLLECTION);

      // Prevent flash of previous theme before bootstrap resolves
      applyTheme('system');

      await runBootstrap();
    })();

    collectionMutationQueueRef.current = resetPromise.then(
      () => undefined,
      () => undefined
    );

    await resetPromise;
  }, [applyCollectionState, runBootstrap]);

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
    async (pageId: PageId, stickerId: StickerIdentifier): Promise<ToggleStickerResult> => {
      return enqueueCollectionMutation(
        (currentCollection) => toggleStickerCollectionState(currentCollection, pageId, stickerId),
        {
          promoteFailureToStorageError: true,
          onReady: (nextCollection, previousCollection) => {
            const wasCollected = getStickerQuantity(previousCollection, pageId, stickerId) > 0;

            if (wasCollected) {
              return;
            }

            void trackAnalyticsEvent('stickers_marked_collected', {
              input_method: 'manual',
              page_id: pageId,
              sticker_count: 1,
              sticker_id: stickerId,
              total_collected_count: countUniqueCollectedStickers(nextCollection)
            });
          }
        }
      );
    },
    [enqueueCollectionMutation]
  );

  const setStickerQuantity = useCallback(
    async (
      pageId: PageId,
      stickerId: StickerIdentifier,
      quantity: number
    ): Promise<UpdateStickerQuantityResult> => {
      return enqueueCollectionMutation(
        (currentCollection) =>
          updateStickerQuantity(currentCollection, pageId, stickerId, quantity),
        {
          promoteFailureToStorageError: true,
          onReady: (nextCollection, previousCollection) => {
            const previousQuantity = getStickerQuantity(previousCollection, pageId, stickerId);

            if (previousQuantity !== 0 || quantity <= 0) {
              return;
            }

            void trackAnalyticsEvent('stickers_marked_collected', {
              input_method: 'manual',
              page_id: pageId,
              sticker_count: 1,
              sticker_id: stickerId,
              total_collected_count: countUniqueCollectedStickers(nextCollection)
            });
          }
        }
      );
    },
    [enqueueCollectionMutation]
  );

  const markScannedStickersAsHave = useCallback(
    async (stickerIds: readonly string[]) => {
      return enqueueCollectionMutation(
        (currentCollection) => markStickersAsHaveInCollection(currentCollection, stickerIds),
        {
          onReady: (nextCollection, _previousCollection, result) => {
            if (result.updatedStickerIds.length === 0) {
              return;
            }

            void trackAnalyticsEvent('stickers_marked_collected', {
              input_method: 'scanner',
              sticker_count: result.updatedStickerIds.length,
              sticker_ids: result.updatedStickerIds,
              total_collected_count: countUniqueCollectedStickers(nextCollection)
            });
          }
        }
      );
    },
    [enqueueCollectionMutation]
  );

  const restoreCollection = useCallback(
    async (persistedCollection: PersistedCollection) => {
      return enqueueCollectionMutation(async () => replacePersistedCollection(persistedCollection));
    },
    [enqueueCollectionMutation]
  );

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
      setStickerQuantity,
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
      setStickerQuantity,
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

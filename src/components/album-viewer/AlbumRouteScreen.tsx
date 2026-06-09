import { useCallback, useContext, type ContextType } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

import { buildInitialShareSelection, encodeShareSelection } from '@/components/share/share-state';
import { type AlbumPage, type StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';
import { derivePageCollectedStickerIds, getStickerQuantity } from '@/services/collection-service';

import { AlbumViewer } from './AlbumViewer';
import { SwipeNavigator } from './SwipeNavigator';
import type { ViewerFilter } from './viewer-state';

type AlbumRouteScreenProps = Readonly<{
  activePage: AlbumPage;
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
}>;

const EMPTY_PAGE_STICKER_QUANTITIES = {} as const;

export function AlbumRouteScreen({
  activePage,
  activeFilter,
  onChangeFilter
}: AlbumRouteScreenProps) {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const location = useLocation();

  const openGlobalShare = useCallback(() => {
    const collection = appState?.collection ?? {};
    const pageIds = buildInitialShareSelection(collection, { type: 'all-missing' });
    const pages = encodeShareSelection(pageIds);

    void navigate({
      to: '/share',
      search: {
        ...(pages ? { pages } : {}),
        from: location.pathname
      }
    });
  }, [appState, location.pathname, navigate]);

  const openCurrentPageShare = useCallback(() => {
    const collection = appState?.collection ?? {};
    const pageIds = buildInitialShareSelection(collection, {
      type: 'current-page',
      pageId: activePage.pageId
    });
    const pages = encodeShareSelection(pageIds);

    void navigate({
      to: '/share',
      search: {
        ...(pages ? { pages } : {}),
        from: location.pathname
      }
    });
  }, [activePage.pageId, appState, location.pathname, navigate]);

  const renderSwipeScreen = useCallback(
    ({
      activePage: visiblePage,
      openQuickNavigation
    }: {
      activePage: AlbumPage;
      openQuickNavigation: () => void;
    }) => {
      return (
        <AlbumViewerContent
          activePage={visiblePage}
          openQuickNavigation={openQuickNavigation}
          activeFilter={activeFilter}
          onChangeFilter={onChangeFilter}
          appState={appState!}
          onOpenGlobalShare={openGlobalShare}
          onOpenCurrentPageShare={openCurrentPageShare}
        />
      );
    },
    [activeFilter, appState, onChangeFilter, openCurrentPageShare, openGlobalShare]
  );

  if (appState === null) {
    return null;
  }

  return (
    <SwipeNavigator key={activePage.pageId} activePageId={activePage.pageId}>
      {renderSwipeScreen}
    </SwipeNavigator>
  );
}

function AlbumViewerContent({
  activePage,
  openQuickNavigation,
  activeFilter,
  onChangeFilter,
  appState,
  onOpenGlobalShare,
  onOpenCurrentPageShare
}: {
  activePage: AlbumPage;
  openQuickNavigation: () => void;
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
  appState: NonNullable<ContextType<typeof AppStateContext>>;
  onOpenGlobalShare: () => void;
  onOpenCurrentPageShare: () => void;
}) {
  const pageCollection = derivePageCollectedStickerIds(appState.collection, activePage.pageId);
  const pageStickerQuantities =
    appState.collection[activePage.pageId] ?? EMPTY_PAGE_STICKER_QUANTITIES;

  const handleSetStickerQuantity = useCallback(
    (stickerId: StickerIdentifier, quantity: number): void => {
      const currentQuantity = getStickerQuantity(appState.collection, activePage.pageId, stickerId);

      if (currentQuantity === quantity) {
        return;
      }

      void appState.setStickerQuantity(activePage.pageId, stickerId, quantity);
    },
    [activePage.pageId, appState]
  );

  return (
    <AlbumViewer
      page={activePage}
      renderState={appState.renderState === 'loading' ? 'loading' : 'ready'}
      collectedStickerIds={pageCollection}
      stickerQuantities={pageStickerQuantities}
      activeFilter={activeFilter}
      onChangeFilter={onChangeFilter}
      onOpenQuickNavigation={openQuickNavigation}
      onOpenCurrentPageShare={onOpenCurrentPageShare}
      onSetStickerQuantity={handleSetStickerQuantity}
      onOpenShare={onOpenGlobalShare}
    />
  );
}

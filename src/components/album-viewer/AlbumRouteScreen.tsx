import { useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

import { buildInitialShareSelection, encodeShareSelection } from '@/components/share/share-state';
import { type AlbumPage, type StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';

import { AlbumViewer } from './AlbumViewer';
import { SwipeNavigator } from './SwipeNavigator';
import type { ViewerFilter } from './viewer-state';

type AlbumRouteScreenProps = Readonly<{
  activePage: AlbumPage;
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
}>;

export function AlbumRouteScreen({
  activePage,
  activeFilter,
  onChangeFilter
}: AlbumRouteScreenProps) {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const location = useLocation();

  const collectionRef = useRef(appState?.collection);
  if (appState) {
    collectionRef.current = appState.collection;
  }

  const openGlobalShare = useCallback(() => {
    if (appState === null) {
      return;
    }

    const pageIds = buildInitialShareSelection(appState.collection, { type: 'all-missing' });
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
    if (appState === null) {
      return;
    }

    const pageIds = buildInitialShareSelection(appState.collection, {
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

  if (appState === null) {
    return null;
  }

  return (
    <SwipeNavigator key={activePage.pageId} activePageId={activePage.pageId}>
      {({ activePage: visiblePage, openQuickNavigation }) => (
        <AlbumViewerContent
          activePage={visiblePage}
          openQuickNavigation={openQuickNavigation}
          activeFilter={activeFilter}
          onChangeFilter={onChangeFilter}
          appState={appState}
          collectionRef={collectionRef}
          onOpenGlobalShare={openGlobalShare}
          onOpenCurrentPageShare={openCurrentPageShare}
        />
      )}
    </SwipeNavigator>
  );
}

function AlbumViewerContent({
  activePage,
  openQuickNavigation,
  activeFilter,
  onChangeFilter,
  appState,
  collectionRef,
  onOpenGlobalShare,
  onOpenCurrentPageShare
}: {
  activePage: AlbumPage;
  openQuickNavigation: () => void;
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
  appState: NonNullable<React.ContextType<typeof AppStateContext>>;
  collectionRef: React.RefObject<
    Readonly<Record<string, ReadonlySet<StickerIdentifier>>> | undefined
  >;
  onOpenGlobalShare: () => void;
  onOpenCurrentPageShare: () => void;
}) {
  const pageCollection =
    appState.collection[activePage.pageId] ??
    (new Set<StickerIdentifier>() as ReadonlySet<StickerIdentifier>);

  const handleToggleSticker = useCallback(
    (stickerId: StickerIdentifier): void => {
      if (!collectionRef.current) return;
      void appState.toggleCollected(collectionRef.current, activePage.pageId, stickerId);
    },
    [activePage.pageId, appState, collectionRef]
  );

  return (
    <AlbumViewer
      page={activePage}
      renderState={appState.renderState === 'loading' ? 'loading' : 'ready'}
      collectedStickerIds={pageCollection}
      activeFilter={activeFilter}
      onChangeFilter={onChangeFilter}
      onOpenQuickNavigation={openQuickNavigation}
      onOpenCurrentPageShare={onOpenCurrentPageShare}
      onToggleSticker={handleToggleSticker}
      onOpenShare={onOpenGlobalShare}
    />
  );
}

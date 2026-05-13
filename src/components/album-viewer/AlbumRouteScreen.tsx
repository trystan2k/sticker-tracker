import { useCallback, useContext, useRef } from 'react';

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

  const collectionRef = useRef(appState?.collection);
  if (appState) {
    collectionRef.current = appState.collection;
  }

  if (appState === null) {
    return null;
  }

  return (
    <SwipeNavigator activePageId={activePage.pageId}>
      {({ activePage: visiblePage, openQuickNavigation }) => (
        <AlbumViewerContent
          activePage={visiblePage}
          openQuickNavigation={openQuickNavigation}
          activeFilter={activeFilter}
          onChangeFilter={onChangeFilter}
          appState={appState}
          collectionRef={collectionRef}
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
  collectionRef
}: {
  activePage: AlbumPage;
  openQuickNavigation: () => void;
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
  appState: NonNullable<React.ContextType<typeof AppStateContext>>;
  collectionRef: React.RefObject<
    Readonly<Record<string, ReadonlySet<StickerIdentifier>>> | undefined
  >;
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
      onToggleSticker={handleToggleSticker}
    />
  );
}

import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useContext, useRef, useState } from 'react';

import { AlbumViewer } from '@/components/album-viewer/AlbumViewer';
import { SwipeNavigator } from '@/components/album-viewer/SwipeNavigator';
import { albumPages, type AlbumPage, type StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';

import type { ViewerFilter } from '@/components/album-viewer/viewer-state';

export const Route = createFileRoute('/')({ component: Home });

function getFirstPageId() {
  const firstPage = albumPages[0];

  if (!firstPage) {
    throw new Error('Album pages dataset cannot be empty.');
  }

  return firstPage.pageId;
}

const firstPageId = getFirstPageId();

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

export function Home() {
  const appState = useContext(AppStateContext);
  const [activeFilter, setActiveFilter] = useState<ViewerFilter>('all');

  const collectionRef = useRef(appState?.collection);
  if (appState) {
    collectionRef.current = appState.collection;
  }

  if (appState === null) {
    return null;
  }

  return (
    <SwipeNavigator initialPageId={firstPageId}>
      {({ activePage, openQuickNavigation }) => (
        <AlbumViewerContent
          activePage={activePage}
          openQuickNavigation={openQuickNavigation}
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          appState={appState}
          collectionRef={collectionRef}
        />
      )}
    </SwipeNavigator>
  );
}

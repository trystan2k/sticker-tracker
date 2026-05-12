import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useContext, useRef, useState } from 'react';

import { AlbumViewer } from '@/components/album-viewer/AlbumViewer';
import { albumPages, type AlbumPage, type PageId, type StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';

export const Route = createFileRoute('/')({ component: Home });

function getFirstPage(): AlbumPage {
  const firstPage = albumPages[0];

  if (!firstPage) {
    throw new Error('Album pages dataset cannot be empty.');
  }

  return firstPage;
}

const firstPage = getFirstPage();

export function Home() {
  const appState = useContext(AppStateContext);
  const [activePageId] = useState<PageId>(firstPage.pageId);

  const collectionRef = useRef(appState?.collection);
  if (appState) {
    collectionRef.current = appState.collection;
  }

  const activePage = albumPages.find((page) => page.pageId === activePageId) ?? firstPage;

  const pageCollection =
    appState?.collection[activePage.pageId] ??
    (new Set<StickerIdentifier>() as ReadonlySet<StickerIdentifier>);

  const handleToggleSticker = useCallback(
    (stickerId: StickerIdentifier): void => {
      if (!appState || !collectionRef.current) return;
      void appState.toggleCollected(collectionRef.current, activePage.pageId, stickerId);
    },
    [appState, activePage.pageId]
  );

  if (appState === null) {
    return null;
  }

  return (
    <AlbumViewer
      page={activePage}
      renderState={appState.renderState === 'loading' ? 'loading' : 'ready'}
      collectedStickerIds={pageCollection}
      onToggleSticker={handleToggleSticker}
    />
  );
}

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useRef } from 'react';

import { MissingScreen } from '@/components/missing/MissingScreen';
import { buildMissingState } from '@/components/missing/missing-state';
import { encodeShareSelection } from '@/components/share/share-state';
import type { PageId, StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';

export const Route = createFileRoute('/missing')({
  component: MissingRoute
});

function MissingRoute() {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const readyAppState = appState && appState.renderState === 'ready' ? appState : null;
  const collectionRef = useRef(readyAppState?.collection ?? {});

  collectionRef.current = readyAppState?.collection ?? {};

  const handleBack = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);

  const handleShare = useCallback(() => {
    const state = buildMissingState(readyAppState!.collection);
    const pages = state.kind === 'ready' ? encodeShareSelection(state.sharePageIds) : undefined;

    void navigate({
      to: '/share',
      search: {
        ...(pages ? { pages } : {}),
        from: '/missing'
      }
    });
  }, [navigate, readyAppState]);

  const handleToggleCollected = useCallback(
    (pageId: PageId, stickerId: StickerIdentifier) => {
      return readyAppState!.toggleCollected(collectionRef.current, pageId, stickerId);
    },
    [readyAppState]
  );

  if (!readyAppState) {
    return null;
  }

  return (
    <MissingScreen
      collection={readyAppState.collection}
      onBack={handleBack}
      onShare={handleShare}
      onToggleCollected={handleToggleCollected}
    />
  );
}

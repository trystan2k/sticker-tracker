import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useMemo } from 'react';

import { RepeatedScreen } from '@/components/repeated/RepeatedScreen';
import { buildRepeatedState } from '@/components/repeated/repeated-state';
import { encodeShareSelection } from '@/components/share/share-state';
import type { PageId, StickerIdentifier } from '@/data/album';
import { AppStateContext } from '@/providers/AppStateProvider';

export const Route = createFileRoute('/repeated')({
  component: RepeatedRoute
});

function RepeatedRoute() {
  const appState = useContext(AppStateContext);
  const navigate = useNavigate();
  const readyAppState = appState && appState.renderState === 'ready' ? appState : null;

  const repeatedState = useMemo(
    () => (readyAppState ? buildRepeatedState(readyAppState.collection) : null),
    [readyAppState]
  );

  const handleBack = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);

  const handleShare = useCallback(() => {
    const nextState = buildRepeatedState(readyAppState!.collection);
    const pages =
      nextState.kind === 'ready' ? encodeShareSelection(nextState.sharePageIds) : undefined;

    void navigate({
      to: '/repeated-share',
      search: {
        ...(pages ? { pages } : {}),
        from: '/repeated'
      }
    });
  }, [navigate, readyAppState]);

  const handleSetStickerQuantity = useCallback(
    (pageId: PageId, stickerId: StickerIdentifier, quantity: number) => {
      return readyAppState!.setStickerQuantity(pageId, stickerId, quantity);
    },
    [readyAppState]
  );

  if (!readyAppState || repeatedState === null) {
    return null;
  }

  return (
    <RepeatedScreen
      collection={readyAppState.collection}
      state={repeatedState}
      onBack={handleBack}
      onShare={handleShare}
      onSetStickerQuantity={handleSetStickerQuantity}
    />
  );
}

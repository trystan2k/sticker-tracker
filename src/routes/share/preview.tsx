import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { SharePreviewScreen } from '@/components/share/SharePreviewScreen';
import {
  buildSharePreviewPayload,
  decodeShareSelection,
  parseShareRouteSearch,
  sanitizeFromPath,
  type ShareRouteSearch
} from '@/components/share/share-state';
import { AppStateContext } from '@/providers/AppStateProvider';
import { trackAnalyticsEvent } from '@/services/analytics-service';

export const Route = createFileRoute('/share/preview')({
  validateSearch: (raw): ShareRouteSearch => parseShareRouteSearch(raw),
  component: SharePreviewRoute
});

function SharePreviewRoute() {
  const appState = useContext(AppStateContext);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const lastTrackedPayloadKeyRef = useRef<string | null>(null);

  const collection = appState?.collection;
  const selectedPageIds = useMemo(() => decodeShareSelection(search.pages), [search.pages]);
  const payload = useMemo(
    () => buildSharePreviewPayload(collection ?? {}, selectedPageIds),
    [collection, selectedPageIds]
  );

  useEffect(() => {
    if (payload.selectedPageCount > 0) {
      return;
    }

    void navigate({
      to: '/share',
      search: {
        ...(search.pages ? { pages: search.pages } : {}),
        from: sanitizeFromPath(search.from)
      },
      replace: true
    });
  }, [navigate, payload.selectedPageCount, search.from, search.pages]);

  useEffect(() => {
    if (payload.selectedPageCount === 0) {
      return;
    }

    const trackingKey = `${payload.selectedPageIds.join(',')}:${payload.totalMissingStickerCount}`;

    if (lastTrackedPayloadKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedPayloadKeyRef.current = trackingKey;

    void trackAnalyticsEvent('share_preview_generated', {
      selected_page_count: payload.selectedPageCount,
      selection_source_path: sanitizeFromPath(search.from),
      total_missing_sticker_count: payload.totalMissingStickerCount
    });
  }, [
    payload.selectedPageCount,
    payload.selectedPageIds,
    payload.totalMissingStickerCount,
    search.from
  ]);

  const handleBack = useCallback(() => {
    void navigate({
      to: '/share',
      search: {
        ...(search.pages ? { pages: search.pages } : {}),
        from: sanitizeFromPath(search.from)
      }
    });
  }, [navigate, search.from, search.pages]);

  if (appState === null || appState.renderState !== 'ready') {
    return null;
  }

  if (payload.selectedPageCount === 0) {
    return null;
  }

  return <SharePreviewScreen payload={payload} onBack={handleBack} />;
}

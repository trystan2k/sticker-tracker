import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import {
  buildRepeatedSharePreviewPayload,
  decodeRepeatedShareSelection,
  parseRepeatedShareRouteSearch
} from '@/components/repeated-share/repeated-share-state';
import { SharePreviewScreen } from '@/components/share/SharePreviewScreen';
import type { ShareRouteSearch } from '@/components/share/share-state';
import { sanitizeFromPath } from '@/lib/sanitize-from-path';
import { AppStateContext } from '@/providers/AppStateProvider';
import { trackAnalyticsEvent } from '@/services/analytics-service';

export const Route = createFileRoute('/repeated-share/preview')({
  validateSearch: (raw): ShareRouteSearch => parseRepeatedShareRouteSearch(raw),
  component: RepeatedSharePreviewRoute
});

function RepeatedSharePreviewRoute() {
  const appState = useContext(AppStateContext);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const lastTrackedPayloadKeyRef = useRef<string | null>(null);
  const isAppReady = appState !== null && appState.renderState === 'ready';

  const collection = appState?.collection;
  const selectedPageIds = useMemo(() => decodeRepeatedShareSelection(search.pages), [search.pages]);
  const payload = useMemo(
    () => buildRepeatedSharePreviewPayload(collection ?? {}, selectedPageIds),
    [collection, selectedPageIds]
  );

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    if (payload.selectedPageCount > 0) {
      return;
    }

    void navigate({
      to: '/repeated-share',
      search: {
        ...(search.pages ? { pages: search.pages } : {}),
        from: sanitizeFromPath(search.from)
      },
      replace: true
    });
  }, [isAppReady, navigate, payload.selectedPageCount, search.from, search.pages]);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    if (payload.selectedPageCount === 0) {
      return;
    }

    const trackingKey = `${payload.selectedPageIds.join(',')}:${payload.totalStickerCount}`;

    if (lastTrackedPayloadKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedPayloadKeyRef.current = trackingKey;

    void trackAnalyticsEvent('share_preview_generated', {
      share_mode: 'repeated',
      selected_page_count: payload.selectedPageCount,
      selection_source_path: sanitizeFromPath(search.from),
      total_repeated_sticker_count: payload.totalStickerCount
    });
  }, [
    isAppReady,
    payload.selectedPageCount,
    payload.selectedPageIds,
    payload.totalStickerCount,
    search.from
  ]);

  const handleBack = useCallback(() => {
    void navigate({
      to: '/repeated-share',
      search: {
        ...(search.pages ? { pages: search.pages } : {}),
        from: sanitizeFromPath(search.from)
      }
    });
  }, [navigate, search.from, search.pages]);

  if (!isAppReady) {
    return null;
  }

  if (payload.selectedPageCount === 0) {
    return null;
  }

  return <SharePreviewScreen payload={payload} onBack={handleBack} mode="repeated" />;
}

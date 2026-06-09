import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useMemo } from 'react';

import {
  buildRepeatedShareSelectionSections,
  decodeRepeatedShareSelection,
  parseRepeatedShareRouteSearch
} from '@/components/repeated-share/repeated-share-state';
import { ShareSelectionScreen } from '@/components/share/ShareSelectionScreen';
import type { ShareRouteSearch } from '@/components/share/share-state';
import { encodeShareSelection } from '@/components/share/share-state';
import type { PageId } from '@/data/album';
import { sanitizeFromPath } from '@/lib/sanitize-from-path';
import { AppStateContext } from '@/providers/AppStateProvider';

export const Route = createFileRoute('/repeated-share/')({
  validateSearch: (raw): ShareRouteSearch => parseRepeatedShareRouteSearch(raw),
  component: RepeatedShareSelectionRoute
});

function RepeatedShareSelectionRoute() {
  const appState = useContext(AppStateContext);
  const search = Route.useSearch();
  const navigate = useNavigate();

  const collection = appState?.collection;
  const sections = useMemo(
    () => buildRepeatedShareSelectionSections(collection ?? {}),
    [collection]
  );
  const selectedPageIds = useMemo(() => decodeRepeatedShareSelection(search.pages), [search.pages]);
  const selectablePageIds = useMemo(
    () =>
      sections
        .flatMap((section) => section.rows)
        .filter((row) => row.stickerCount > 0)
        .map((row) => row.pageId),
    [sections]
  );

  const setSelected = useCallback(
    (nextPageIds: readonly PageId[]) => {
      const nextValue = encodeShareSelection(nextPageIds);

      void navigate({
        to: '/repeated-share',
        search: {
          ...(nextValue ? { pages: nextValue } : {}),
          from: sanitizeFromPath(search.from)
        },
        replace: true
      });
    },
    [navigate, search.from]
  );

  const handleBack = useCallback(() => {
    void navigate({ to: sanitizeFromPath(search.from) });
  }, [navigate, search.from]);

  const handleTogglePage = useCallback(
    (pageId: PageId) => {
      const selectedSet = new Set(selectedPageIds);

      if (selectedSet.has(pageId)) {
        selectedSet.delete(pageId);
      } else {
        selectedSet.add(pageId);
      }

      setSelected(Array.from(selectedSet));
    },
    [selectedPageIds, setSelected]
  );

  const handleGenerate = useCallback(
    (nextPageIds: readonly PageId[]) => {
      const nextValue = encodeShareSelection(nextPageIds);

      void navigate({
        to: '/repeated-share/preview',
        search: {
          ...(nextValue ? { pages: nextValue } : {}),
          from: sanitizeFromPath(search.from)
        }
      });
    },
    [navigate, search.from]
  );

  const handleSelectAll = useCallback(
    () => setSelected(selectablePageIds),
    [selectablePageIds, setSelected]
  );
  const handleClear = useCallback(() => setSelected([]), [setSelected]);

  if (appState === null || appState.renderState !== 'ready') {
    return null;
  }

  return (
    <ShareSelectionScreen
      sections={sections}
      selectedPageIds={selectedPageIds}
      onBack={handleBack}
      onTogglePage={handleTogglePage}
      onSelectAll={handleSelectAll}
      onClear={handleClear}
      onGenerate={handleGenerate}
      mode="repeated"
    />
  );
}

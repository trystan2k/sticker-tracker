import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useSyncExternalStore } from 'react';

import type { ViewerFilter } from '@/components/album-viewer/viewer-state';

// Module-level store for activeFilter — avoids SSR/hydration timing issues
let activeFilterStore: ViewerFilter = 'all';
const filterListeners = new Set<() => void>();

function getSnapshot(): ViewerFilter {
  return activeFilterStore;
}

function subscribe(callback: () => void): () => void {
  filterListeners.add(callback);
  return () => filterListeners.delete(callback);
}

function setActiveFilter(filter: ViewerFilter): void {
  activeFilterStore = filter;
  filterListeners.forEach((listener) => listener());
}

export type AlbumRouteContext = Readonly<{
  activeFilter: ViewerFilter;
  onChangeFilter: (filter: ViewerFilter) => void;
}>;

export function useAlbumRouteContext(): AlbumRouteContext {
  const activeFilter = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    activeFilter,
    onChangeFilter: setActiveFilter
  };
}

export const Route = createFileRoute('/album')({ component: AlbumLayout });

function AlbumLayout() {
  return <Outlet />;
}

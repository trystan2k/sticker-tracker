import { createFileRoute, redirect } from '@tanstack/react-router';

import { AlbumRouteScreen } from '@/components/album-viewer/AlbumRouteScreen';
import { getAlbumPageByRoute } from '@/components/album-viewer/viewer-state';

import { useAlbumRouteContext } from '../album';

export const Route = createFileRoute('/album/$pageId')({
  beforeLoad: ({ params }) => {
    if (!getAlbumPageByRoute(undefined, params.pageId)) {
      throw redirect({ to: '/' });
    }
  },
  component: AlbumSpecialPageRoute
});

function AlbumSpecialPageRoute() {
  const { pageId } = Route.useParams();
  const { activeFilter, onChangeFilter } = useAlbumRouteContext();

  const activePage = getAlbumPageByRoute(undefined, pageId);

  if (!activePage) {
    throw redirect({ to: '/' });
  }

  return (
    <AlbumRouteScreen
      activePage={activePage}
      activeFilter={activeFilter}
      onChangeFilter={onChangeFilter}
    />
  );
}

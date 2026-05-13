import { createFileRoute, notFound } from '@tanstack/react-router';

import { AlbumRouteScreen } from '@/components/album-viewer/AlbumRouteScreen';
import { getAlbumPageByRoute } from '@/components/album-viewer/viewer-state';

import { useAlbumRouteContext } from '../../album';

export const Route = createFileRoute('/album/$group/$pageId')({
  beforeLoad: ({ params }) => {
    if (!getAlbumPageByRoute(params.group, params.pageId)) {
      throw notFound();
    }
  },
  component: AlbumTeamPageRoute
});

function AlbumTeamPageRoute() {
  const { group, pageId } = Route.useParams();
  const { activeFilter, onChangeFilter } = useAlbumRouteContext();

  // beforeLoad guarantees valid group+pageId — lookup cannot fail here
  const activePage = getAlbumPageByRoute(group, pageId)!;

  return (
    <AlbumRouteScreen
      activePage={activePage}
      activeFilter={activeFilter}
      onChangeFilter={onChangeFilter}
    />
  );
}

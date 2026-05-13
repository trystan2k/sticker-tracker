import { createFileRoute, redirect } from '@tanstack/react-router';

import { AlbumRouteScreen } from '@/components/album-viewer/AlbumRouteScreen';
import { getAlbumPageByRoute } from '@/components/album-viewer/viewer-state';

import { useAlbumRouteContext } from '../../album';

export const Route = createFileRoute('/album/$group/$pageId')({
  beforeLoad: ({ params }) => {
    if (!getAlbumPageByRoute(params.group, params.pageId)) {
      throw redirect({ to: '/' });
    }
  },
  component: AlbumTeamPageRoute
});

function AlbumTeamPageRoute() {
  const { group, pageId } = Route.useParams();
  const { activeFilter, onChangeFilter } = useAlbumRouteContext();

  const activePage = getAlbumPageByRoute(group, pageId);

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

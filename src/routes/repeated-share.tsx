import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/repeated-share')({ component: RepeatedShareLayout });

function RepeatedShareLayout() {
  return <Outlet />;
}

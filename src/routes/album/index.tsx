import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/album/')({
  beforeLoad: () => {
    throw redirect({ to: '/' });
  }
});

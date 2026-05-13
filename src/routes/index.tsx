import { createFileRoute } from '@tanstack/react-router';

import { HomeScreen } from '@/components/home/HomeScreen';

export const Route = createFileRoute('/')({ component: Home });

export function Home() {
  return <HomeScreen />;
}

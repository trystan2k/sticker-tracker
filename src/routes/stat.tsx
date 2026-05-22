import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useContext, useEffect, useRef } from 'react';

import { StatsScreen } from '@/components/stats/StatsScreen';
import { buildStatsState } from '@/components/stats/stats-state';
import { sanitizeFromPath } from '@/lib/sanitize-from-path';
import { AppStateContext } from '@/providers/AppStateProvider';
import { trackAnalyticsEvent } from '@/services/analytics-service';

type StatsRouteSearch = {
  from?: string;
};

function sanitizeSourcePath(from: unknown): string {
  if (typeof from !== 'string') {
    return '/stat';
  }

  const pathOnly = from.split(/[?#]/u, 1)[0] ?? '';
  const sanitized = sanitizeFromPath(pathOnly);

  return sanitized === '/' && pathOnly !== '/' ? '/stat' : sanitized;
}

export const Route = createFileRoute('/stat')({
  validateSearch: (raw): StatsRouteSearch => {
    if (typeof raw.from === 'string') {
      return { from: raw.from };
    }

    return {};
  },
  component: StatsRoute
});

function StatsRoute() {
  const appState = useContext(AppStateContext);
  const search = useSearch({ from: '/stat' });
  const navigate = useNavigate();
  const hasTrackedOpenRef = useRef(false);

  useEffect(() => {
    if (appState === null || appState.renderState !== 'ready' || hasTrackedOpenRef.current) {
      return;
    }

    hasTrackedOpenRef.current = true;

    void trackAnalyticsEvent('stats_page_opened', {
      source_path: sanitizeSourcePath(search.from)
    });
  }, [appState, search.from]);

  const handleBack = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);

  if (appState === null || appState.renderState !== 'ready') {
    return null;
  }

  const state = buildStatsState(appState.collection);

  return <StatsScreen onBack={handleBack} state={state} />;
}

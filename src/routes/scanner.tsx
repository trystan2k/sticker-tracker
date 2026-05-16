import { redirect, createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense, useCallback } from 'react';

import { FEATURE_FLAGS } from '@/config/features';

const LazyScannerScreen = lazy(async () => {
  const module = await import('@/components/scanner/ScannerScreen');

  return { default: module.ScannerScreen };
});

function isSafeInAppOrigin(origin: string): boolean {
  return origin.startsWith('/') && !origin.startsWith('//') && !origin.includes('\\');
}

export const Route = createFileRoute('/scanner')({
  validateSearch: (search) => {
    const origin = typeof search.origin === 'string' ? search.origin : '/';

    return {
      origin: isSafeInAppOrigin(origin) ? origin : '/'
    };
  },
  beforeLoad: () => {
    if (!FEATURE_FLAGS.scannerEnabled) {
      throw redirect({ to: '/' });
    }
  },
  component: ScannerRoute
});

function ScannerRoute() {
  const navigate = useNavigate();

  const queryOrigin =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('origin');
  const origin =
    typeof queryOrigin === 'string' && isSafeInAppOrigin(queryOrigin) ? queryOrigin : '/';

  const handleBack = useCallback(() => {
    void navigate({ to: origin || '/' });
  }, [navigate, origin]);

  return (
    <Suspense fallback={null}>
      <LazyScannerScreen onBack={handleBack} onFinishScanning={handleBack} />
    </Suspense>
  );
}

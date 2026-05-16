import { redirect, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { lazy, Suspense, useCallback } from 'react';

import { FEATURE_FLAGS } from '@/config/features';

const LazyScannerScreen = lazy(async () => {
  const module = await import('@/components/scanner/ScannerScreen');

  return { default: module.ScannerScreen };
});

export const Route = createFileRoute('/scanner')({
  beforeLoad: () => {
    if (!FEATURE_FLAGS.scannerEnabled) {
      throw redirect({ to: '/' });
    }
  },
  component: ScannerRoute
});

function ScannerRoute() {
  const navigate = useNavigate();
  const router = useRouter();

  const handleBack = useCallback(() => {
    const history = router.history;
    if (history.length > 1) {
      history.back();
    } else {
      void navigate({ to: '/' });
    }
  }, [navigate, router.history]);

  return (
    <Suspense fallback={null}>
      <LazyScannerScreen onBack={handleBack} onFinishScanning={handleBack} />
    </Suspense>
  );
}

type ScannerFeatureEnv = Readonly<{
  VITE_SCANNER_ENABLED?: string;
  PROD: boolean;
}>;

export function resolveScannerEnabled(env: ScannerFeatureEnv): boolean {
  if (env.VITE_SCANNER_ENABLED === 'true') {
    return true;
  }

  if (env.VITE_SCANNER_ENABLED === 'false') {
    return false;
  }

  return !env.PROD;
}

export const FEATURE_FLAGS = {
  scannerEnabled: resolveScannerEnabled(import.meta.env)
} as const;

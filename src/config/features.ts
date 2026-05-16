type ScannerFeatureEnv = Readonly<{
  VITE_SCANNER_ENABLED?: string;
  VITE_SCANNER_DIAGNOSTICS_ENABLED?: string;
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

export function resolveScannerDiagnosticsEnabled(env: ScannerFeatureEnv): boolean {
  if (env.VITE_SCANNER_DIAGNOSTICS_ENABLED === 'true') {
    return true;
  }

  return false;
}

export const FEATURE_FLAGS = {
  scannerEnabled: resolveScannerEnabled(import.meta.env),
  scannerDiagnosticsEnabled: resolveScannerDiagnosticsEnabled(import.meta.env)
} as const;

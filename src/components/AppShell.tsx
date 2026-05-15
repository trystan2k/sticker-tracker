import type { ReactNode } from 'react';

import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { PwaUpdateToast } from '@/components/pwa/PwaUpdateToast';
import { PwaInstallSheet } from '@/components/pwa/PwaInstallSheet';

import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <nav className={styles.nav} aria-label="Navigation" />
      <div className={styles.overlay} />
      <div className={styles.toast} aria-live="polite">
        <PwaUpdateToast />
        <PwaInstallBanner />
      </div>
      <PwaInstallSheet />
    </div>
  );
}

import type { ReactNode } from 'react';

import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <nav className={styles.nav} aria-label="Navigation" />
      <div className={styles.overlay} aria-live="polite" />
      <div className={styles.toast} aria-live="polite" />
    </div>
  );
}

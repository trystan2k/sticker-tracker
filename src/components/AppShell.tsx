import type { ReactNode } from 'react';

import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
  localeSwitcher?: ReactNode;
}

export function AppShell({ children, localeSwitcher }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.logo}> stickers</span>
          {localeSwitcher && <div className={styles.headerActions}>{localeSwitcher}</div>}
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <nav className={styles.nav} aria-label="Navigation" />

      <div className={styles.overlay} aria-live="polite" />

      <div className={styles.toast} aria-live="polite" />
    </div>
  );
}

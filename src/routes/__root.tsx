import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { type ReactNode, useContext, useEffect } from 'react';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import { PwaProvider } from '@/providers/PwaProvider';
import { AppShell } from '@/components/AppShell';
import { NotFoundPage } from '@/components/not-found/NotFoundPage';

// oxlint-disable-next-line import/no-unassigned-import
import '@/styles.css';

export const Route = createRootRoute({
  head: () => ({
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico'
      },
      {
        rel: 'manifest',
        href: '/manifest.json'
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png'
      }
    ],
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        title: 'Sticker Tracker'
      },
      {
        name: 'description',
        content: 'Track your COPA 26 sticker album progress'
      },
      {
        name: 'theme-color',
        content: 'var(--color-brand-primary)'
      }
    ]
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument
});

interface RootDocumentProps {
  children: ReactNode;
}

function RootDocument({ children }: RootDocumentProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AppStateProvider>
          <PwaProvider>
            <RootLanguageSync />
            <AppShell>{children}</AppShell>
          </PwaProvider>
        </AppStateProvider>
        <Scripts />
      </body>
    </html>
  );
}

export function RootLanguageSync() {
  const appState = useContext(AppStateContext);

  useEffect(() => {
    if (appState?.renderState !== 'ready') {
      return;
    }

    document.documentElement.lang = appState.locale;
  }, [appState?.locale, appState?.renderState]);

  return null;
}

import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { type ReactNode, useContext, useEffect } from 'react';

import { AppStateContext, AppStateProvider } from '@/providers/AppStateProvider';
import { AppShell } from '@/components/AppShell';
import { NotFoundPage } from '@/components/not-found/NotFoundPage';

// oxlint-disable-next-line import/no-unassigned-import
import '@/styles.css';

export const Route = createRootRoute({
  head: () => ({
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
        content: 'Track your FIFA 2026 sticker album progress'
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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppStateProvider>
          <RootLanguageSync />
          <AppShell>{children}</AppShell>
          <TanStackDevtools
            // oxlint-disable-next-line jsx-no-new-object-as-prop
            config={{
              position: 'bottom-right'
            }}
            // oxlint-disable-next-line jsx-no-new-array-as-prop
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />
              }
            ]}
          />
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

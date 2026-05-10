import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppStateContext } from '@/providers/AppStateProvider';

export const Route = createFileRoute('/')({ component: Home });

export function Home() {
  const appState = useContext(AppStateContext);
  const { t } = useTranslation();

  if (appState === null) {
    return null;
  }

  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
      <p>{t('app.currentLanguage', { locale: appState.locale })}</p>
    </section>
  );
}

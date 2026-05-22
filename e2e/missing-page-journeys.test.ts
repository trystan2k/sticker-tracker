import { expect, test } from '@playwright/test';

import { openHomeMenu, waitForMainContent } from './utils/journey-helpers';

const missingTitlePattern = /Missing Stickers|Figurinhas faltantes|Cromos faltantes/i;
const shareTitlePattern = /Share Missing|Compartilhar Faltantes|Compartir Faltantes/i;

test.describe('missing page journeys', () => {
  test('drawer navigation opens /missing and back returns home', async ({ page }) => {
    await page.goto('/');
    await waitForMainContent(page);

    await openHomeMenu(page);
    await page
      .getByRole('button', { name: /Missing Stickers|Figurinhas faltantes|Cromos faltantes/i })
      .click();

    await expect(page).toHaveURL('/missing');
    await expect(page.getByRole('heading', { name: missingTitlePattern })).toBeVisible();

    await page.getByRole('button', { name: /Back|Voltar|Volver/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('share from /missing uses from=/missing and back returns to /missing', async ({ page }) => {
    await page.goto('/missing');
    await expect(page.getByRole('heading', { name: missingTitlePattern })).toBeVisible();

    await page
      .getByRole('button', {
        name: /Share missing stickers|Compartilhar figurinhas faltantes|Compartir cromos faltantes/i
      })
      .click();

    await expect(page).toHaveURL(
      (url) => url.pathname === '/share' && url.searchParams.get('from') === '/missing'
    );

    await expect(page.getByRole('heading', { name: shareTitlePattern })).toBeVisible();

    await page.getByRole('button', { name: /Back|Voltar|Volver/i }).click();
    await expect(page).toHaveURL('/missing');
  });
});

import { expect, test, type Page } from '@playwright/test';

import { waitForMainContent } from './utils/journey-helpers';

const statsHeadingPattern = /Stats|Estadísticas|Estatísticas/i;
const featuredTeamsHeadingPattern = /Featured teams|Selecciones destacadas|Seleções em destaque/i;
const groupPanoramaHeadingPattern = /Group panorama|Panorama de grupos/i;
const completedGroupsLabelPattern = /Completed groups|Grupos completos/i;
const incompleteGroupsLabelPattern = /Incomplete groups|Grupos incompletos/i;
const moreStickersPattern = /More stickers|Más cromos|Mais figurinhas/i;
const lessStickersPattern = /Less stickers|Menos cromos|Menos figurinhas/i;
const closedChipPattern = /Closed|Cerrados|Fechados/i;
const openChipPattern = /^Open$|^No cerrados$|^Não fechados$/i;
const allGroupsPattern = /All groups|Todos los grupos|Todos os grupos/i;
const emptySpotlightDescriptionPattern =
  /Start collecting stickers to unlock this section\.|Empieza a coleccionar cromos para desbloquear esta sección\.|Comece a colecionar figurinhas para desbloquear esta seção\./i;

async function waitForStatReady(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: statsHeadingPattern })).toBeVisible();
  await expect(page.getByRole('heading', { name: featuredTeamsHeadingPattern })).toBeVisible();
  await expect(page.getByRole('heading', { name: groupPanoramaHeadingPattern })).toBeVisible();
}

test.describe('stats page journeys', () => {
  test('happy path: enter from home CTA, see key stats, go back home', async ({ page }) => {
    await page.goto('/');
    await waitForMainContent(page);

    const statsCta = page.getByTestId('home-stats-cta');
    await expect(statsCta).toBeVisible();
    await statsCta.click();

    await expect(page).toHaveURL(
      (url) => url.pathname === '/stat' && url.searchParams.get('from') === '/'
    );

    await waitForStatReady(page);
    await expect(page.getByText(completedGroupsLabelPattern).first()).toBeVisible();
    await expect(page.getByText(incompleteGroupsLabelPattern).first()).toBeVisible();

    const panoramaSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: groupPanoramaHeadingPattern })
    });

    await expect(panoramaSection.getByText(moreStickersPattern).first()).toBeVisible();
    await expect(panoramaSection.getByText(lessStickersPattern).first()).toBeVisible();

    await page.getByRole('button', { name: /Back|Volver|Voltar/i }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByLabel(/Album progress|Progreso del álbum|Progresso do álbum/i)
    ).toBeVisible();
  });

  test('edge: direct /stat entry shows zero-progress empty spotlight state and back works', async ({
    page
  }) => {
    await page.goto('/stat');
    await waitForStatReady(page);

    await expect(page).toHaveURL((url) => url.pathname === '/stat');

    const heroSection = page.locator('section').first();
    const completedCard = heroSection.locator('article').nth(1);
    const incompleteCard = heroSection.locator('article').nth(2);

    await expect(completedCard).toContainText(completedGroupsLabelPattern);
    await expect(completedCard).toContainText(/0\s+(completed|completos)/i);
    await expect(incompleteCard).toContainText(incompleteGroupsLabelPattern);
    await expect(incompleteCard).toContainText(/12\s+(open|abiertos|abertos)/i);

    const spotlightSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: featuredTeamsHeadingPattern })
    });

    await expect(spotlightSection.getByText(moreStickersPattern).first()).toBeVisible();
    await expect(spotlightSection.getByText(lessStickersPattern).first()).toBeVisible();
    await expect(spotlightSection.getByText(emptySpotlightDescriptionPattern)).toHaveCount(2);

    const panoramaSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: groupPanoramaHeadingPattern })
    });

    await expect(panoramaSection.getByText(closedChipPattern, { exact: true })).toBeVisible();
    await expect(panoramaSection.getByText(openChipPattern, { exact: true })).toBeVisible();
    await expect(panoramaSection.getByText(allGroupsPattern)).toBeVisible();

    await page.getByRole('button', { name: /Back|Volver|Voltar/i }).click();
    await expect(page).toHaveURL('/');
  });
});

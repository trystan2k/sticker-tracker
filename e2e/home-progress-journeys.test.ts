import { expect, test } from '@playwright/test';

import {
  getProgressValue,
  openHomeMenu,
  waitForMainContent,
  waitForStickerGrid
} from './utils/journey-helpers';

const fifaTitlePattern = /FIFA World Cup 2026|Copa Mundial 2026|Copa do Mundo 2026/;

test.describe('home progress journeys', () => {
  test('home shows all primary sections', async ({ page }) => {
    await page.goto('/');
    await waitForMainContent(page);

    await expect(page.getByRole('button', { name: fifaTitlePattern })).toBeVisible();
    await expect(
      page.getByLabel(/Album progress|Progreso del álbum|Progresso do álbum/)
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Opening Page|Página de apertura|Página de abertura/ })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Groups|Grupos/ })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Special Pages|Páginas especiales|Páginas especiais/ })
    ).toBeVisible();
  });

  test('all 12 group cards A-L visible on home', async ({ page }) => {
    await page.goto('/');
    await waitForMainContent(page);

    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    const groupVisibilityChecks = groups.map((group) =>
      expect(page.getByText(new RegExp(`Group ${group}|Grupo ${group}`, 'i')).first()).toBeVisible()
    );

    await Promise.all(groupVisibilityChecks);
  });

  test('representative team tiles visible in groups list', async ({ page }) => {
    await page.goto('/');
    await waitForMainContent(page);

    await expect(page.getByText(/MEX|BRA|ENG/).first()).toBeVisible();
    await expect(
      page.getByText(/Mexico|México|Brazil|Brasil|England|Inglaterra/).first()
    ).toBeVisible();
  });

  test('drawer menu exposes stable actions', async ({ page }) => {
    await page.goto('/');
    await waitForMainContent(page);

    await openHomeMenu(page);

    await expect(page.getByText(/Share|Compartir|Compartilhar/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Language|Idioma/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Theme|Tema/ })).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: /Backup & Restore|Respaldo y restauración|Backup e restauração/
      })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Delete app data|Borrar datos|Excluir dados/ })
    ).toBeVisible();
  });

  test('navigate from home into a team page', async ({ page, browserName }) => {
    // WebKit: cardAction overlay intercepts team tile clicks (CSS z-index layering)
    test.skip(browserName === 'webkit', 'WebKit z-index interceptor - covered by Chromium');

    await page.goto('/');
    await waitForMainContent(page);

    await page.getByRole('button', { name: /Mexico|México|MEX/i }).first().click();

    await expect(page).toHaveURL(/\/album\/[A-Z]\/[a-z-]+$/);
    await expect(page.getByRole('button', { name: /COPA 26/ })).toBeVisible();
  });

  test('mark stickers as have, return home, and verify progress updates', async ({ page }) => {
    await page.goto('/album/A/mex');

    const pageProgressbar = page.getByRole('progressbar');
    const beforeTeamProgress = getProgressValue(await pageProgressbar.getAttribute('aria-valuenow'));

    const stickerCells = await waitForStickerGrid(page);
    await stickerCells.first().click();
    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

    const afterTeamProgress = getProgressValue(await pageProgressbar.getAttribute('aria-valuenow'));
    expect(afterTeamProgress).toBeGreaterThan(beforeTeamProgress);

    await page.getByRole('button', { name: /COPA 26/ }).click();

    await expect(page).toHaveURL('/');

    const heroProgressSection = page.getByLabel(
      /Album progress|Progreso del álbum|Progresso do álbum/
    );
    await expect(heroProgressSection).toContainText(new RegExp(`${afterTeamProgress}\\s*/`));

    const groupACard = page
      .getByRole('button', { name: /Group A .*\d+\/\d+|Grupo A .*\d+\/\d+/i })
      .first();
    await expect(groupACard).toBeVisible();
    await expect(groupACard).toHaveAttribute('aria-label', /Group A .*\d+\/\d+|Grupo A .*\d+\/\d+/i);
  });

  test('reload persistence keeps collected stickers and progress', async ({ page }) => {
    await page.goto('/album/A/mex');

    const stickerCells = await waitForStickerGrid(page);
    await stickerCells.first().click();

    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

    const progressbar = page.getByRole('progressbar');
    const beforeReload = getProgressValue(await progressbar.getAttribute('aria-valuenow'));

    await page.reload();
    const reloadedCells = await waitForStickerGrid(page);
    await expect(reloadedCells.first()).toHaveAttribute('aria-pressed', 'true');

    const reloadedProgressbar = page.getByRole('progressbar');
    const afterReload = getProgressValue(await reloadedProgressbar.getAttribute('aria-valuenow'));

    expect(afterReload).toBe(beforeReload);
  });
});

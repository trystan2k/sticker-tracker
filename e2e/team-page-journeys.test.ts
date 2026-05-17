import { expect, test } from '@playwright/test';

import { getProgressValue, waitForStickerGrid } from './utils/journey-helpers';

test.describe('team page journeys', () => {
  test('team page loads with correct header metadata', async ({ page }) => {
    await page.goto('/album/A/mex');

    await expect(
      page.getByRole('button', {
        name: /Open quick navigation picker|Abrir selector rápido|Abrir navegação rápida/
      })
    ).toBeVisible();
    await expect(page.getByText(/Mexico|México/)).toBeVisible();
    await expect(page.getByText(/Group A|Grupo A/)).toBeVisible();
  });

  test('sticker grid visible with aria-pressed attributes', async ({ page }) => {
    await page.goto('/album/A/mex');

    const stickerCells = await waitForStickerGrid(page);
    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', /true|false/);
  });

  test('mark sticker as collected updates tile and progress', async ({ page }) => {
    await page.goto('/album/A/mex');

    const stickerCells = await waitForStickerGrid(page);
    const progressbar = page.getByRole('progressbar');

    const before = getProgressValue(await progressbar.getAttribute('aria-valuenow'));

    await stickerCells.first().click();

    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

    const after = getProgressValue(await progressbar.getAttribute('aria-valuenow'));
    expect(after).toBeGreaterThan(before);
  });

  test('unmark sticker decrements progress', async ({ page }) => {
    await page.goto('/album/A/mex');

    const stickerCells = await waitForStickerGrid(page);
    const progressbar = page.getByRole('progressbar');

    await stickerCells.first().click();
    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

    const collectedValue = getProgressValue(await progressbar.getAttribute('aria-valuenow'));

    await stickerCells.first().click();
    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'false');

    const uncollectedValue = getProgressValue(await progressbar.getAttribute('aria-valuenow'));
    expect(uncollectedValue).toBeLessThan(collectedValue);
  });

  test('reload persistence keeps collected stickers and page progress', async ({ page }) => {
    await page.goto('/album/A/mex');

    const stickerCells = await waitForStickerGrid(page);
    const progressbar = page.getByRole('progressbar');

    await stickerCells.first().click();
    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

    const beforeReload = getProgressValue(await progressbar.getAttribute('aria-valuenow'));

    await page.reload();

    const reloadedCells = await waitForStickerGrid(page);
    const reloadedProgressbar = page.getByRole('progressbar');

    await expect(reloadedCells.first()).toHaveAttribute('aria-pressed', 'true');

    const afterReload = getProgressValue(await reloadedProgressbar.getAttribute('aria-valuenow'));
    expect(afterReload).toBe(beforeReload);
  });

  test('both album route shapes render correctly', async ({ page }) => {
    await page.goto('/album/fwc-opening');
    await waitForStickerGrid(page);
    await expect(page).toHaveURL(/\/album\/fwc-opening$/);

    await page.goto('/album/A/mex');
    await waitForStickerGrid(page);
    await expect(page).toHaveURL(/\/album\/A\/mex$/);
  });
});

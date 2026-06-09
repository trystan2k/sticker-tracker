import { expect, test } from '@playwright/test';

import { waitForStickerGrid } from './utils/journey-helpers';

test('click sticker cell, verify progress, reload, verify persistence', async ({ page }) => {
  await page.goto('/album/fwc-opening');

  const stickerCells = await waitForStickerGrid(page);
  const totalStickers = await stickerCells.count();

  for (let i = 0; i < totalStickers; i++) {
    // oxlint-disable-next-line no-await-in-loop
    await expect(stickerCells.nth(i)).toHaveAttribute('aria-pressed', 'false');
  }

  const progressbar = page.getByRole('progressbar');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '0');

  await stickerCells.first().click();
  await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '1');

  await stickerCells.nth(1).click();
  await expect(stickerCells.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '2');

  await page.reload();

  const reloadedCells = await waitForStickerGrid(page);
  await expect(reloadedCells.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(reloadedCells.nth(1)).toHaveAttribute('aria-pressed', 'true');

  const reloadedProgressbar = page.getByRole('progressbar');
  await expect(reloadedProgressbar).toHaveAttribute('aria-valuenow', '2');
});

test('single tap adds repeated copy, reload persists it, double click path decrements and unmarks', async ({
  page
}) => {
  await page.goto('/album/fwc-opening');

  const stickerCells = await waitForStickerGrid(page);
  const firstSticker = stickerCells.first();
  const repeatedBadge = firstSticker.locator('span[aria-hidden="true"]');
  const progressbar = page.getByRole('progressbar');

  await firstSticker.click();
  await expect(firstSticker).toHaveAttribute('aria-pressed', 'true');
  await expect(repeatedBadge).toHaveCount(0);
  await expect(progressbar).toHaveAttribute('aria-valuenow', '1');

  await firstSticker.click();
  await expect(firstSticker).toHaveAttribute('aria-pressed', 'true');
  await expect(repeatedBadge).toHaveText('1');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '1');

  await page.reload();

  const reloadedCells = await waitForStickerGrid(page);
  const reloadedFirstSticker = reloadedCells.first();
  const reloadedRepeatedBadge = reloadedFirstSticker.locator('span[aria-hidden="true"]');
  const reloadedProgressbar = page.getByRole('progressbar');

  await expect(reloadedFirstSticker).toHaveAttribute('aria-pressed', 'true');
  await expect(reloadedRepeatedBadge).toHaveText('1');
  await expect(reloadedProgressbar).toHaveAttribute('aria-valuenow', '1');

  await reloadedFirstSticker.dblclick();
  await expect(reloadedFirstSticker).toHaveAttribute('aria-pressed', 'true');
  await expect(reloadedRepeatedBadge).toHaveCount(0);
  await expect(reloadedProgressbar).toHaveAttribute('aria-valuenow', '1');

  await reloadedFirstSticker.dblclick();
  await expect(reloadedFirstSticker).toHaveAttribute('aria-pressed', 'false');
  await expect(reloadedProgressbar).toHaveAttribute('aria-valuenow', '0');

  await page.reload();

  const finalCells = await waitForStickerGrid(page);
  await expect(finalCells.first()).toHaveAttribute('aria-pressed', 'false');

  const finalProgressbar = page.getByRole('progressbar');
  await expect(finalProgressbar).toHaveAttribute('aria-valuenow', '0');
});

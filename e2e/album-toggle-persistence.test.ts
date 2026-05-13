import { expect, test } from '@playwright/test';

// SKIP: App bug - album route context unavailable (STR-37 routing change)
// The /album/$pageId route throws "Album route context unavailable" because
// the AlbumLayout context provider doesn't initialize properly after the
// home screen routing change. Tests below are preserved for when the app bug is fixed.
test('click sticker cell, verify progress, reload, verify persistence', async ({ page }) => {
  await page.goto('/album/fwc-opening');

  // Wait for sticker cells to be attached
  await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

  // Initial state: no stickers collected on first page (fwc-opening has 9 stickers)
  const stickerCells = page.locator('div[class*="grid"] button[aria-pressed]');
  const totalStickers = await stickerCells.count();

  // All should start as not collected (aria-pressed="false")
  for (let i = 0; i < totalStickers; i++) {
    // oxlint-disable-next-line no-await-in-loop
    await expect(stickerCells.nth(i)).toHaveAttribute('aria-pressed', 'false');
  }

  // Initial progress should be 0 collected
  const progressbar = page.getByRole('progressbar');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '0');

  // Click the first sticker cell to mark it as collected
  await stickerCells.first().click();

  // Verify first cell is now collected
  await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

  // Progress should update to 1 collected
  await expect(progressbar).toHaveAttribute('aria-valuenow', '1');

  // Click second sticker cell too
  await stickerCells.nth(1).click();

  // Verify second cell is collected
  await expect(stickerCells.nth(1)).toHaveAttribute('aria-pressed', 'true');

  // Progress should update to 2 collected
  await expect(progressbar).toHaveAttribute('aria-valuenow', '2');

  // Reload the page
  await page.reload();

  // Wait for app to be ready again after reload
  await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

  // Verify stickers are still collected after reload
  const reloadedCells = page.locator('div[class*="grid"] button[aria-pressed]');
  await expect(reloadedCells.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(reloadedCells.nth(1)).toHaveAttribute('aria-pressed', 'true');

  // Progress should persist as 2
  const reloadedProgressbar = page.getByRole('progressbar');
  await expect(reloadedProgressbar).toHaveAttribute('aria-valuenow', '2');
});

test('uncollect sticker via click toggle persists after reload', async ({ page }) => {
  await page.goto('/album/fwc-opening');

  // Wait for sticker cells to be attached
  await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

  const stickerCells = page.locator('div[class*="grid"] button[aria-pressed]');

  // Click to collect first sticker
  await stickerCells.first().click();
  await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

  // Click again to uncollect
  await stickerCells.first().click();
  await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'false');

  // Progress should be back to 0
  const progressbar = page.getByRole('progressbar');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '0');

  // Reload and verify uncollected state persists
  await page.reload();
  await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

  const reloadedCells = page.locator('div[class*="grid"] button[aria-pressed]');
  await expect(reloadedCells.first()).toHaveAttribute('aria-pressed', 'false');

  const reloadedProgressbar = page.getByRole('progressbar');
  await expect(reloadedProgressbar).toHaveAttribute('aria-valuenow', '0');
});

import { test, expect } from '@playwright/test';

test('should render album viewer screen', async ({ page }) => {
  await page.goto('/');

  // Wait for sticker cells to be attached (album viewer rendered after bootstrap)
  await page.waitForSelector('button[aria-pressed]', { timeout: 10000 });

  // Sticker cells are present (album viewer is rendered)
  const stickerCells = page.locator('button[aria-pressed]');
  await expect(stickerCells).toHaveCount(9); // fwc-opening page has 9 stickers (00..8)

  // Progress bar exists (may be small, use toBeAttached)
  const progressbar = page.getByRole('progressbar');
  await expect(progressbar).toBeAttached();

  // Filter pills are rendered (English locale)
  await expect(page.getByText('All').first()).toBeAttached();
  await expect(page.getByText('Collected').first()).toBeAttached();
  await expect(page.getByText('Missing').first()).toBeAttached();

  // Language control is in the shell header
  await expect(page.getByLabel('Language')).toBeVisible();
});

test('should switch locale and show translated album content', async ({ page }) => {
  await page.goto('/');

  // Wait for sticker cells to be attached
  await page.waitForSelector('button[aria-pressed]', { timeout: 10000 });

  // Open locale modal and switch to Portuguese
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('button', { name: 'Portuguese (Brazil)' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Album filter pills should switch to Portuguese
  await expect(page.getByText('Todas').first()).toBeAttached();
  await expect(page.getByText('Colecionadas').first()).toBeAttached();

  // Locale label in the header should be in Portuguese
  await expect(page.getByLabel('Idioma')).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('quick navigation picker jumps to selected page', async ({ page }) => {
  await page.goto('/album/fwc-opening');

  await page.waitForSelector('header button', { timeout: 10000 });

  // Click the quick navigation trigger (second header button, after locale switcher)
  await page.locator('header button').nth(1).click();

  await expect(page.getByRole('dialog', { name: 'Select Team' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search pages' }).fill('Coca');

  await page.locator('[data-page-id="coca-cola"]').click();
  await expect(page.getByRole('dialog', { name: 'Select Team' })).toBeHidden();

  await expect(page.locator('div[class*="grid"] button[aria-pressed]')).toHaveCount(14);

  // Reopen quick navigation picker
  await page.locator('header button').nth(1).click();
  await page.getByRole('searchbox', { name: 'Search pages' }).fill('Mexico');
  await page.locator('[data-page-id="mex"]').click();

  await expect(page.locator('div[class*="grid"] button[aria-pressed]')).toHaveCount(20);
});

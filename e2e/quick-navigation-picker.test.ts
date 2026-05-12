import { expect, test } from '@playwright/test';

test('quick navigation picker jumps to selected page', async ({ page }) => {
  await page.goto('/');

  await page.waitForSelector('header button', { timeout: 10000 });

  await page.locator('header button').first().click();

  await expect(page.getByRole('dialog', { name: 'Select Team' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search pages' }).fill('Coca');

  await page.locator('[data-page-id="coca-cola"]').click();
  await expect(page.getByRole('dialog', { name: 'Select Team' })).toBeHidden();

  await expect(page.locator('div[class*="grid"] button[aria-pressed]')).toHaveCount(14);

  await page.locator('header button').first().click();
  await page.getByRole('searchbox', { name: 'Search pages' }).fill('Mexico');
  await page.locator('[data-page-id="mex"]').click();

  await expect(page.locator('div[class*="grid"] button[aria-pressed]')).toHaveCount(20);
});

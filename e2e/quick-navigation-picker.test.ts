import { expect, test } from '@playwright/test';

test('quick navigation picker jumps to selected page', async ({ page }) => {
  await page.goto('/album/fwc-opening');
  await expect(page).toHaveURL(/\/album\/fwc-opening$/);

  await page.waitForSelector('header button', { timeout: 10000 });

  // Click the quick navigation trigger (center button with specific aria-label)
  await page.getByRole('button', { name: 'Open quick navigation picker' }).click();

  await expect(page.getByRole('dialog', { name: 'Select Team' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search pages' }).fill('Coca');

  await page.locator('[data-page-id="coca-cola"]').click();
  await expect(page.getByRole('dialog', { name: 'Select Team' })).toBeHidden();
  await expect(page).toHaveURL(/\/album\/coca-cola$/);

  await expect(page.locator('div[class*="grid"] button[aria-pressed]')).toHaveCount(14);

  // Reopen quick navigation picker
  await page.getByRole('button', { name: 'Open quick navigation picker' }).click();
  await page.getByRole('searchbox', { name: 'Search pages' }).fill('Mexico');
  await page.locator('[data-page-id="mex"]').click();

  await expect(page.locator('div[class*="grid"] button[aria-pressed]')).toHaveCount(20);
  await expect(page).toHaveURL(/\/album\/(?:[A-Z]\/)?mex$/);
});

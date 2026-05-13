import { test, expect } from '@playwright/test';

test('should render home screen content', async ({ page }) => {
  await page.goto('/');

  // Home header title button is visible
  await expect(page.getByRole('button', { name: 'FIFA World Cup 2026' })).toBeVisible();

  // Progress ring section exists
  const progressSection = page.getByLabel('Album progress');
  await expect(progressSection).toBeVisible();

  // Language control is in the home header
  await expect(page.getByLabel('Open menu')).toBeVisible();

  // Group cards section is present
  await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();

  // Special pages section is present (now rendered twice: opening + others)
  await expect(page.getByRole('heading', { name: 'Special Pages' }).first()).toBeVisible();
});

test('should switch locale from home screen', async ({ page }) => {
  await page.goto('/');

  // Home header title button is visible
  await expect(page.getByRole('button', { name: 'FIFA World Cup 2026' })).toBeVisible();

  // Open menu drawer, then language row, then switch to Portuguese
  await page.getByLabel('Open menu').click();
  await page.getByLabel('Language').click();
  await page.getByRole('button', { name: 'Portuguese (Brazil)' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Menu button should now show Portuguese label
  await expect(page.getByLabel('Abrir menu')).toBeVisible();
});

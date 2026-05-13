import { test, expect } from '@playwright/test';

test('should render home screen content', async ({ page }) => {
  await page.goto('/');

  // Home header title is visible
  await expect(page.getByRole('heading', { name: 'FIFA World Cup 2026' })).toBeVisible();

  // Progress ring section exists
  const progressSection = page.getByLabel('Home progress');
  await expect(progressSection).toBeVisible();

  // Language control is in the home header
  await expect(page.getByLabel('Open language menu')).toBeVisible();

  // Group cards section is present
  await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();

  // Special pages section is present (now rendered twice: opening + others)
  await expect(page.getByRole('heading', { name: 'Special Pages' }).first()).toBeVisible();
});

test('should switch locale from home screen', async ({ page }) => {
  await page.goto('/');

  // Home header is visible
  await expect(page.getByRole('heading', { name: 'FIFA World Cup 2026' })).toBeVisible();

  // Open locale modal and switch to Portuguese
  await page.getByLabel('Open language menu').click();
  await page.getByRole('button', { name: 'Portuguese (Brazil)' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Home header title should still be visible (translated or not)
  await expect(page.getByLabel('Abrir menu de idioma')).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('should render translated foundation screen', async ({ page }) => {
  await page.goto('/');

  // Wait for app to be ready (loading state resolves)
  await page.waitForSelector('main', { state: 'visible' });

  await expect(page.getByRole('heading', { name: 'Sticker Tracker' })).toBeVisible();
  await expect(page.getByText('Internationalization foundation ready.')).toBeVisible();

  // Language control is in the shell header
  await expect(page.getByLabel('Language')).toBeVisible();
});

test('should switch locale on the screen', async ({ page }) => {
  await page.goto('/');

  // Wait for app to be ready
  await page.waitForSelector('main', { state: 'visible' });

  await page.getByLabel('Language').selectOption('pt-BR');

  await expect(page.getByText('Base de internacionalização pronta.')).toBeVisible();
});

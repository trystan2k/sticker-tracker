import { test, expect } from '@playwright/test';

test('should render translated foundation screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sticker Tracker' })).toBeVisible();
  await expect(page.getByText('Internationalization foundation ready.')).toBeVisible();
  await expect(page.getByLabel('Language')).toBeVisible();
});

test('should switch locale on the screen', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Language').selectOption('pt-BR');

  await expect(page.getByText('Base de internacionalização pronta.')).toBeVisible();
});

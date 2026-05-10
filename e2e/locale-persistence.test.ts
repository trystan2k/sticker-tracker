import { expect, test } from '@playwright/test';

test('persists locale after reload', async ({ page }) => {
  await page.goto('/');

  await page.locator('#locale-switcher').selectOption('es');
  await expect(page.getByText('Base de internacionalización lista.')).toBeVisible();

  await page.reload();

  await expect(page.locator('#locale-switcher')).toHaveValue('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

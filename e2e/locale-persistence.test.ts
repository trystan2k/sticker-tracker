import { expect, test } from '@playwright/test';

test('persists locale after reload', async ({ page }) => {
  await page.goto('/');

  // Wait for app to be ready
  await page.waitForSelector('main', { state: 'visible' });

  // Locale switcher is in the header (shell)
  const localeSelect = page.getByRole('combobox');

  await localeSelect.selectOption('es');
  await expect(page.getByText('Base de internacionalización lista.')).toBeVisible();

  await page.reload();

  // App should still show the persisted locale
  await expect(localeSelect).toHaveValue('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

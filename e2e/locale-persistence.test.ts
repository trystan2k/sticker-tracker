import { expect, test } from '@playwright/test';

test('persists locale after reload', async ({ page }) => {
  await page.goto('/');

  // Wait for home screen header to be visible
  await expect(page.getByRole('heading', { name: /FIFA World Cup|Copa Mundial/ })).toBeVisible({
    timeout: 10000
  });

  const localeMenuTrigger = page.getByLabel('Open language menu');
  await localeMenuTrigger.click();

  const spanishRow = page.getByRole('button', { name: 'Spanish' });
  await spanishRow.click();

  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Home header should still be visible (now in Spanish)
  await expect(page.getByRole('heading', { name: 'Copa Mundial FIFA 2026' })).toBeVisible();

  await page.reload();

  // Wait for home screen to be ready again after reload
  await expect(page.getByRole('heading', { name: 'Copa Mundial FIFA 2026' })).toBeVisible({
    timeout: 10000
  });

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  // Home screen should still be visible after reload
  await expect(page.getByRole('heading', { name: 'Copa Mundial FIFA 2026' })).toBeVisible();
});

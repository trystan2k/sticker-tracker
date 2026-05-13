import { expect, test } from '@playwright/test';

test('persists locale after reload', async ({ page }) => {
  await page.goto('/');

  // Wait for home screen header title button to be visible
  await expect(
    page.getByRole('button', { name: /FIFA World Cup|Copa Mundial/ }).first()
  ).toBeVisible({
    timeout: 10000
  });

  const menuTrigger = page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ });
  await menuTrigger.click();

  await page.getByRole('button', { name: /Language|Idioma/ }).click();

  const spanishRow = page.getByRole('button', { name: 'Spanish' });
  await spanishRow.click();

  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Home header title button should still be visible (now in Spanish)
  await expect(page.getByRole('button', { name: 'Copa Mundial FIFA 2026' })).toBeVisible();

  await page.reload();

  // Wait for home screen title button to be ready again after reload
  await expect(page.getByRole('button', { name: 'Copa Mundial FIFA 2026' })).toBeVisible({
    timeout: 10000
  });

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  // Home screen title button should still be visible after reload
  await expect(page.getByRole('button', { name: 'Copa Mundial FIFA 2026' })).toBeVisible();
});

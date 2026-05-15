import { expect, test } from '@playwright/test';

test.describe('Theme persistence', () => {
  test('theme row visible in menu drawer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();

    await expect(page.getByRole('button', { name: /Theme|Tema/ })).toBeVisible();
  });

  test('selecting Light applies data-theme="light"', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Theme|Tema/ }).click();

    // Theme sheet dialog should open (aria-label="Theme")
    await expect(page.getByRole('dialog', { name: 'Theme' })).toBeVisible({ timeout: 10000 });

    // Click Light
    await page.getByRole('button', { name: 'Light' }).click();

    // Theme sheet should close
    await expect(page.getByRole('dialog', { name: 'Theme' })).not.toBeVisible({ timeout: 5000 });

    // HTML should have data-theme="light"
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('selecting Dark applies data-theme="dark"', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Theme|Tema/ }).click();

    await expect(page.getByRole('dialog', { name: 'Theme' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Dark' }).click();

    await expect(page.getByRole('dialog', { name: 'Theme' })).not.toBeVisible({ timeout: 5000 });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('selecting System removes data-theme attribute', async ({ page }) => {
    await page.goto('/');

    // First set to light so we have a data-theme to remove
    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Theme|Tema/ }).click();
    await expect(page.getByRole('dialog', { name: 'Theme' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Now switch to system
    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Theme|Tema/ }).click();
    await expect(page.getByRole('dialog', { name: 'Theme' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'System' }).click();

    await expect(page.getByRole('dialog', { name: 'Theme' })).not.toBeVisible({ timeout: 5000 });

    // data-theme should be removed
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  });

  test('theme persists after page reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Theme|Tema/ }).click();
    await expect(page.getByRole('dialog', { name: 'Theme' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Dark' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();

    // Wait for app to be ready
    await expect(
      page.getByRole('button', { name: /FIFA World Cup|Copa Mundial/ }).first()
    ).toBeVisible({ timeout: 10000 });

    // Theme should persist
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

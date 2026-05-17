import { expect, test } from '@playwright/test';

test.describe('Delete App Data', () => {
  test('delete data row visible in menu drawer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();

    await expect(
      page.getByRole('button', { name: /Delete app data|Borrar datos|Excluir dados/ })
    ).toBeVisible();
  });

  test('cancel delete does nothing', async ({ page }) => {
    await page.goto('/');

    // Wait for app to be ready
    await expect(
      page.getByRole('button', { name: /FIFA World Cup|Copa Mundial/ }).first()
    ).toBeVisible({ timeout: 10000 });

    // Set up dialog handler BEFORE clicking delete
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Delete app data|Borrar datos|Excluir dados/ }).click();

    // Page should still be on home
    await expect(
      page.getByRole('button', { name: /FIFA World Cup|Copa Mundial/ }).first()
    ).toBeVisible();
  });

  test('confirm delete clears data and navigates home', async ({ page }) => {
    // First, collect a sticker so we have data to delete
    await page.goto('/album/fwc-opening');
    await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

    const stickerCells = page.locator('div[class*="grid"] button[aria-pressed]');
    await stickerCells.first().click();
    await expect(stickerCells.first()).toHaveAttribute('aria-pressed', 'true');

    // Set up dialog handler BEFORE navigating and clicking delete
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Navigate home and delete data
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
    await page.getByRole('button', { name: /Delete app data|Borrar datos|Excluir dados/ }).click();

    // Should navigate back to home after delete
    await expect(page).toHaveURL('/');

    // Wait for app to be ready after reset
    await expect(
      page.getByRole('button', { name: /FIFA World Cup|Copa Mundial/ }).first()
    ).toBeVisible({ timeout: 10000 });

    // WebKit can lag one navigation behind after IndexedDB reset in long full-suite runs.
    // Reload before the final assertion so we verify persisted state, not stale in-memory state.
    await page.reload();

    // Verify data was cleared - navigate to album and check sticker is uncollected
    await page.goto('/album/fwc-opening');
    await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

    const reloadedCells = page.locator('div[class*="grid"] button[aria-pressed]');
    await expect(reloadedCells.first()).toHaveAttribute('aria-pressed', 'false');
  });
});

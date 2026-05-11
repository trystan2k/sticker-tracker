import { expect, test } from '@playwright/test';

test('persists locale after reload', async ({ page }) => {
  await page.goto('/');

  // Wait for sticker cells to be attached
  await page.waitForSelector('button[aria-pressed]', { timeout: 10000 });

  const localeMenuTrigger = page.getByRole('button', { name: 'Language' });
  await localeMenuTrigger.click();

  const spanishRow = page.getByRole('button', { name: 'Spanish' });
  await spanishRow.click();

  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Album filter pills should switch to Spanish
  await expect(page.getByText('Todas').first()).toBeAttached();
  await expect(page.getByText('Faltantes').first()).toBeAttached();

  await page.reload();

  // Wait for app to be ready again after reload
  await page.waitForSelector('button[aria-pressed]', { timeout: 10000 });

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  // Spanish album content should still be visible after reload
  await expect(page.getByText('Todas').first()).toBeAttached();
});

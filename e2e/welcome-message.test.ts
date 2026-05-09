import { test, expect } from '@playwright/test';

test('should render welcome message', async ({ page }) => {
  await page.goto('/');

  // Check that the welcome heading is visible
  await expect(page.locator('h1')).toHaveText('Welcome to TanStack Start');

  // Check that the paragraph is visible
  await expect(page.locator('p')).toContainText('Edit src/routes/index.tsx to get started.');
});

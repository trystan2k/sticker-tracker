import { expect, test } from '@playwright/test';

test('renders not found page for unknown URL', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(
    page.getByText("The page you're looking for doesn't exist or was moved.")
  ).toBeVisible();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await expect(page).toHaveURL('/');
});

test('renders not found page for invalid album page URL', async ({ page }) => {
  await page.goto('/album/not-a-page');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to home' })).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('scanner route loads idle state', async ({ page }) => {
  await page.goto('/scanner');

  // Wait for app to be ready
  await page.waitForSelector('main', { timeout: 10000 });

  // Should show idle state with start button
  const heading = page.getByTestId('scanner-heading');
  await expect(heading).toBeVisible();
  await expect(heading).toContainText('Scan');

  // Should have a start button
  const startButton = page.getByTestId('scanner-cta-button');
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();
});

test('scanner idle state shows back button', async ({ page }) => {
  await page.goto('/');

  // Wait for home to load
  await page.waitForSelector('main', { timeout: 10000 });

  // Navigate to scanner
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Back button should be visible (aria-label="Back")
  const backButton = page.getByRole('button', { name: 'Back' });
  await expect(backButton).toBeVisible();

  // Click back should navigate away
  await backButton.click();

  // Should navigate back (to home or previous route)
  await page.waitForURL(/\/$/, { timeout: 5000 });
});

test('scanner shows NEW badge', async ({ page }) => {
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Should show NEW badge
  const badge = page.getByTestId('scanner-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toContainText('NEW');
});

test('scanner idle state has description text', async ({ page }) => {
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Should show description about pointing camera
  const description = page.getByTestId('scanner-description');
  await expect(description).toBeVisible();
  await expect(description).toContainText(/camera|point/i);
});

test('scanner finish button visible in active state (mocked)', async ({ page, browserName }) => {
  // WebKit: camera mock unreliable (captureStream issues); skip
  test.skip(browserName === 'webkit', 'WebKit camera mock unreliable');

  // Grant camera permission (skip on webkit - already skipped above)
  const context = page.context();
  await context.grantPermissions(['camera']);

  // Mock getUserMedia to return a fake stream so state becomes 'active'
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      // Create a fake stream using canvas captureStream
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      return canvas.captureStream();
    };
  });

  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Click start to activate scanner
  const startButton = page.getByTestId('scanner-cta-button');
  await startButton.click();

  // Wait for scanner to become active (video element should appear)
  await page.waitForSelector('[data-testid="scanner-video"]', { timeout: 10000 });

  // Finish button should be visible in active state
  const finishButton = page.getByTestId('scanner-finish-button');
  await expect(finishButton).toBeVisible();
});

test('scanner status text updates during scanning', async ({ page, browserName }) => {
  // WebKit: camera mock unreliable; skip
  test.skip(browserName === 'webkit', 'WebKit camera mock unreliable');

  // Grant camera permission
  const context = page.context();
  await context.grantPermissions(['camera']);

  // Mock getUserMedia to return a fake stream
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      return canvas.captureStream();
    };
  });

  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Click start
  const startButton = page.getByTestId('scanner-cta-button');
  await startButton.click();

  // Wait for video element (indicates active state)
  await page.waitForSelector('[data-testid="scanner-video"]', { timeout: 10000 });

  // Status text should show scanning or ready message
  const statusSection = page.getByTestId('scanner-status');
  await expect(statusSection).toBeVisible();
});

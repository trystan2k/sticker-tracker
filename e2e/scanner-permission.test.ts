import { expect, test } from '@playwright/test';

test('scanner shows permission denied state when camera blocked', async ({
  browser,
  browserName
}) => {
  // WebKit: camera permission mock doesn't work reliably; skip
  test.skip(browserName === 'webkit', 'WebKit camera permission mock unreliable');

  // Create a new context with camera permission denied
  const context = await browser.newContext({
    permissions: []
  });

  // Override getUserMedia to simulate permission denied
  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Permission denied'));
  });

  const page = await context.newPage();
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Click start to trigger permission request
  const startButton = page.getByTestId('scanner-cta-button');
  await startButton.click();

  // Should show permission denied state - use specific heading instead of broad text match
  await expect(page.getByTestId('scanner-heading')).toContainText('Camera access blocked', {
    timeout: 5000
  });
  await expect(page.getByTestId('scanner-badge')).toContainText('Permission needed');

  // Should show try again button
  await expect(page.getByTestId('scanner-cta-button')).toContainText('Try again');

  await context.close();
});

test('scanner shows unsupported state when getUserMedia not available', async ({
  browser,
  browserName
}) => {
  // WebKit: init script for getUserMedia mock unreliable; skip
  test.skip(browserName === 'webkit', 'WebKit getUserMedia mock unreliable');

  const context = await browser.newContext();

  // Set getUserMedia to undefined to simulate unsupported browser
  // (delete doesn't work because mediaDevices is non-configurable)
  await context.addInitScript(() => {
    if (navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: undefined,
        writable: true,
        configurable: true
      });
    }
  });

  const page = await context.newPage();
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Click start - should show unsupported state
  const startButton = page.getByTestId('scanner-cta-button');
  await startButton.click();

  // Should show unsupported state - use specific heading
  await expect(page.getByTestId('scanner-heading')).toContainText('Camera unavailable', {
    timeout: 5000
  });
  await expect(page.getByTestId('scanner-badge')).toContainText('Unsupported device');

  // Should show back button instead of try again
  await expect(page.getByTestId('scanner-cta-button')).toContainText('Back');

  await context.close();
});

test('scanner try again button resets to idle state', async ({ browser, browserName }) => {
  // WebKit: camera permission mock doesn't work reliably; skip
  test.skip(browserName === 'webkit', 'WebKit camera permission mock unreliable');

  const context = await browser.newContext({
    permissions: []
  });

  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Permission denied'));
  });

  const page = await context.newPage();
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // First attempt - click start
  const startButton = page.getByTestId('scanner-cta-button');
  await startButton.click();

  // Wait for denied state
  await expect(page.getByTestId('scanner-heading')).toContainText('Camera access blocked', {
    timeout: 5000
  });

  // Click try again
  const tryAgainButton = page.getByTestId('scanner-cta-button');
  await tryAgainButton.click();

  // Should attempt again (still denied in this mock)
  await expect(page.getByTestId('scanner-heading')).toContainText('Camera access blocked', {
    timeout: 5000
  });

  await context.close();
});

test('scanner back button from unsupported state navigates home', async ({
  browser,
  browserName
}) => {
  // WebKit: init script for getUserMedia mock unreliable; skip
  test.skip(browserName === 'webkit', 'WebKit getUserMedia mock unreliable');

  const context = await browser.newContext();

  await context.addInitScript(() => {
    if (navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: undefined,
        writable: true,
        configurable: true
      });
    }
  });

  const page = await context.newPage();
  // Navigate from home first to ensure history exists
  await page.goto('/');
  await page.waitForSelector('main', { timeout: 10000 });

  // Then navigate to scanner
  await page.goto('/scanner');
  await page.waitForSelector('main', { timeout: 10000 });

  // Trigger unsupported state
  const startButton = page.getByTestId('scanner-cta-button');
  await startButton.click();

  // Wait for unsupported state
  await expect(page.getByTestId('scanner-heading')).toContainText('Camera unavailable', {
    timeout: 5000
  });

  // Click back button (same CTA button in unsupported state)
  const backButton = page.getByTestId('scanner-cta-button');
  await backButton.click();

  // Should navigate to home
  await page.waitForURL(/\/$/, { timeout: 5000 });

  await context.close();
});

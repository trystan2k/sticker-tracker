import { expect, test, type Page } from '@playwright/test';

async function swipeLeft(page: Page) {
  const swipeThreshold = await page
    .locator('[data-testid="swipe-surface"]')
    .getAttribute('data-swipe-threshold');
  const threshold = Number(swipeThreshold);

  await page.evaluate((thresholdValue) => {
    const target = document.querySelector('[data-testid="swipe-surface"]');
    if (!target) throw new Error('Missing swipe surface');

    const startX = 220;
    const startY = 180;
    const endX = startX - thresholdValue - 24;
    const endY = startY;

    const start = new Event('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(start, 'touches', { value: [{ clientX: startX, clientY: startY }] });
    Object.defineProperty(start, 'changedTouches', {
      value: [{ clientX: startX, clientY: startY }]
    });

    const move = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(move, 'touches', { value: [{ clientX: endX, clientY: endY }] });
    Object.defineProperty(move, 'changedTouches', { value: [{ clientX: endX, clientY: endY }] });

    const end = new Event('touchend', { bubbles: true, cancelable: true });
    Object.defineProperty(end, 'touches', { value: [] });
    Object.defineProperty(end, 'changedTouches', { value: [{ clientX: endX, clientY: endY }] });

    target.dispatchEvent(start);
    target.dispatchEvent(move);
    target.dispatchEvent(end);
  }, threshold);
}

test('collection filter stays active across page changes', async ({ page }) => {
  await page.goto('/');

  await page.waitForSelector('[data-testid="swipe-surface"]', { timeout: 10000 });
  await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

  const filterRow = page.getByLabel('Sticker filters');
  const allFilter = filterRow.getByRole('button', { name: 'All', exact: true });
  const collectedFilter = filterRow.getByRole('button', { name: 'Collected', exact: true });

  await expect(allFilter).toHaveAttribute('aria-pressed', 'true');

  const stickerButtons = page.locator('button[class*="cell"]');
  await expect(stickerButtons.first()).toBeVisible();
  await stickerButtons.first().click();

  await collectedFilter.click();
  await expect(collectedFilter).toHaveAttribute('aria-pressed', 'true');

  await swipeLeft(page);

  await expect(collectedFilter).toHaveAttribute('aria-pressed', 'true');

  await allFilter.click();
  await expect(allFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(collectedFilter).toHaveAttribute('aria-pressed', 'false');
});

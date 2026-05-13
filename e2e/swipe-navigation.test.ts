import { expect, test } from '@playwright/test';

test('swipe navigation follows album order with wraparound', async ({ page }) => {
  await page.goto('/album/fwc-opening');
  await expect(page).toHaveURL(/\/album\/fwc-opening$/);

  await page.waitForSelector('[data-testid="swipe-surface"]', { timeout: 10000 });
  await page.waitForSelector('div[class*="grid"] button[aria-pressed]', { timeout: 10000 });

  const stickerCells = page.locator('div[class*="grid"] button[aria-pressed]');
  await expect(stickerCells).toHaveCount(9);

  // Read swipe threshold from the swipe surface data attribute
  const swipeThreshold = await page
    .locator('[data-testid="swipe-surface"]')
    .getAttribute('data-swipe-threshold');
  const threshold = Number(swipeThreshold);

  await page.evaluate((swipeThresholdValue) => {
    const target = document.querySelector('[data-testid="swipe-surface"]');
    if (!target) throw new Error('Missing swipe surface');

    const startX = 220;
    const startY = 180;
    const endX = startX - swipeThresholdValue - 24;
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

  await expect(stickerCells).toHaveCount(20);
  await expect(page).toHaveURL(/\/album\/(?:[A-Z]\/)?mex$/);

  await page.evaluate((swipeThresholdValue) => {
    const target = document.querySelector('[data-testid="swipe-surface"]');
    if (!target) throw new Error('Missing swipe surface');

    const startX = 80;
    const startY = 180;
    const endX = startX + swipeThresholdValue + 24;
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

  await expect(stickerCells).toHaveCount(9);
  await expect(page).toHaveURL(/\/album\/fwc-opening$/);

  await page.evaluate((swipeThresholdValue) => {
    const target = document.querySelector('[data-testid="swipe-surface"]');
    if (!target) throw new Error('Missing swipe surface');

    const startX = 80;
    const startY = 180;
    const endX = startX + swipeThresholdValue + 24;
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

  await expect(stickerCells).toHaveCount(14);
  await expect(page).toHaveURL(/\/album\/coca-cola$/);
});

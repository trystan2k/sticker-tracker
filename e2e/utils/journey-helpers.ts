import { expect, type Locator, type Page } from '@playwright/test';

const menuButtonPattern = /Open menu|Abrir menú|Abrir menu/;

export async function waitForMainContent(page: Page): Promise<void> {
  await page.waitForSelector('main', { timeout: 10000 });
}

export async function openHomeMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: menuButtonPattern }).click();
}

export async function waitForStickerGrid(page: Page): Promise<Locator> {
  const stickerCells = page.locator('div[class*="grid"] button[aria-pressed]');
  await expect(stickerCells.first()).toBeVisible();

  return stickerCells;
}

export function getProgressValue(progressbarRaw: string | null): number {
  return Number.parseInt(progressbarRaw ?? '0', 10);
}

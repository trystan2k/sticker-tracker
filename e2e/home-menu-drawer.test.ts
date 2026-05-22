import { expect, test } from '@playwright/test';

test('opens and closes left drawer on home', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();

  await expect(page.getByRole('button', { name: /Language|Idioma/ })).toBeVisible();
  await expect(page.getByText(/Share|Compartir|Compartilhar/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Missing Stickers|Figurinhas faltantes|Figuritas faltantes/ })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Theme|Tema/ })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Delete app data|Borrar datos|Excluir dados/ })
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Language|Idioma/ })).not.toBeVisible();
});

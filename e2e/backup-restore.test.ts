import { expect, test } from '@playwright/test';

test('shows backup and restore row on home drawer', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();

  await expect(
    page.getByRole('button', {
      name: /Backup & Restore|Respaldo y restauración|Backup e restauração/
    })
  ).toBeVisible();
});

test('opens BackupRestoreSheet when clicking the row', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
  await page
    .getByRole('button', {
      name: /Backup & Restore|Respaldo y restauración|Backup e restauração/
    })
    .click();

  await expect(
    page.getByRole('dialog', {
      name: /Backup & Restore|Respaldo y restauración|Backup e restauração/
    })
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: /Export backup|Exportar respaldo|Exportar backup/ })
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: /Restore backup|Restaurar respaldo|Restaurar backup/ })
  ).toBeVisible();
});

test('exports backup using fallback download path', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'showSaveFilePicker');
  });

  await page.goto('/');

  await page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ }).click();
  await page
    .getByRole('button', {
      name: /Backup & Restore|Respaldo y restauración|Backup e restauração/
    })
    .click();

  const downloadPromise = page.waitForEvent('download');

  await page
    .getByRole('button', {
      name: /Export backup|Exportar respaldo|Exportar backup/
    })
    .click();

  const download = await downloadPromise;
  const fileName = download.suggestedFilename();

  expect(fileName).toMatch(/^sticker-tracker-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
});

// NOTE: Full restore flow E2E is hard to automate because:
// - showOpenFilePicker requires user gesture and cannot be stubbed reliably in Playwright
// - The file input fallback opens a native OS file chooser that Playwright cannot interact with
// - Restore requires a valid backup JSON file to be selected, which needs manual intervention
// These scenarios are covered by browser-level component tests in
// test/components/BackupRestoreSheet.browser.test.tsx using mocked service calls.

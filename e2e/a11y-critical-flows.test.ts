import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { openHomeMenu } from './utils/journey-helpers';

// Policy: fail on any axe violation (not only critical) to prevent moderate/minor issues from accumulating.
async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();

  expect(
    results.violations,
    results.violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
      )
      .join('\n')
  ).toHaveLength(0);
}

async function setDarkTheme(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  // Allow pending effects to settle, then verify and re-apply if needed
  await page.waitForTimeout(1500);
  const isDark = await page.evaluate(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  if (!isDark) {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);
  }
}

async function waitForHomeReady(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /Open menu|Abrir menú|Abrir menu/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Groups|Grupos|Grupos/i })).toBeVisible();
}

async function waitForAlbumReady(page: Page): Promise<void> {
  await expect(page.locator('div[class*="grid"] button[aria-pressed]').first()).toBeVisible();
}

async function waitForScannerIdleReady(page: Page): Promise<void> {
  await expect(page.getByTestId('scanner-cta-button')).toBeVisible();
}

async function waitForShareSelectionReady(page: Page): Promise<void> {
  await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
}

async function waitForSharePreviewReady(page: Page): Promise<void> {
  await expect(
    page.getByRole('button', { name: /Share|Compartir|Compartilhar/i }).first()
  ).toBeVisible();
}

async function waitForStatReady(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { name: /Stats|Estadísticas|Estatísticas/i })
  ).toBeVisible();
}

async function waitForMissingReady(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', {
      name: /Missing Stickers|Figurinhas faltantes|Figuritas faltantes/i
    })
  ).toBeVisible();
}

test('a11y: home page has no axe violations', async ({ page }) => {
  await page.goto('/');
  await waitForHomeReady(page);

  await expectNoA11yViolations(page);
});

test('a11y: home drawer open has no axe violations and keyboard flow works', async ({ page }) => {
  await page.goto('/');
  await waitForHomeReady(page);

  await openHomeMenu(page);
  const drawerDialog = page.locator('[role="dialog"][aria-labelledby="menu-drawer-title"]');
  const drawerCloseButton = drawerDialog.getByRole('button', { name: /Close|Cerrar|Fechar/i });
  await expect(drawerDialog).toBeVisible();

  await expect(page.getByRole('button', { name: /Language|Idioma/ })).toBeVisible();
  await expect(drawerDialog).toContainText(/Share|Compartir|Compartilhar/);

  // Focus must move inside dialog after opening.
  await expect(drawerCloseButton).toBeFocused();
  await page.waitForTimeout(250);

  await expectNoA11yViolations(page);

  // ESC must close dialog.
  await page.keyboard.press('Escape');
  await expect(drawerDialog).toBeHidden();
});

test('a11y: special album page has no axe violations', async ({ page }) => {
  await page.goto('/album/fwc-opening');
  await waitForAlbumReady(page);

  await expectNoA11yViolations(page);
});

test('a11y: team album page has no axe violations', async ({ page }) => {
  await page.goto('/album/A/mex');
  await waitForAlbumReady(page);

  await expectNoA11yViolations(page);
});

test('a11y: scanner idle has no axe violations', async ({ page }) => {
  await page.goto('/scanner');
  await waitForScannerIdleReady(page);

  await expectNoA11yViolations(page);
});

test('a11y: scanner active has no axe violations', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit camera mock unreliable');

  const context = page.context();
  await context.grantPermissions(['camera']);

  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      return canvas.captureStream();
    };
  });

  await page.goto('/scanner');
  await waitForScannerIdleReady(page);
  await page.getByTestId('scanner-cta-button').click();
  await page.waitForSelector('[data-testid="scanner-video"]', { timeout: 10000 });

  await expectNoA11yViolations(page);
});

test('a11y: share selection from home drawer has no axe violations', async ({ page }) => {
  await page.goto('/');
  await waitForHomeReady(page);

  await openHomeMenu(page);
  await page
    .getByRole('button', { name: /Share Missing|Compartir Faltantes|Compartilhar Faltantes/ })
    .click();
  await page.waitForURL(/\/share(?:\?.*)?$/);
  await waitForShareSelectionReady(page);

  await expect(page.locator('[role="dialog"][aria-labelledby="menu-drawer-title"]')).toBeHidden();

  await expectNoA11yViolations(page);
});

test('a11y: share preview has no axe violations', async ({ page }) => {
  await page.goto('/share');
  await waitForShareSelectionReady(page);

  const firstCheckbox = page.locator('input[type="checkbox"]').first();
  await firstCheckbox.check();

  await page.getByRole('button', { name: /Generate Image|Generar Imagen|Gerar Imagem/ }).click();
  await page.waitForURL(/\/share\/preview(?:\?.*)?$/);
  await waitForSharePreviewReady(page);

  await expectNoA11yViolations(page);
});

test('a11y: /stat has no axe violations', async ({ page }) => {
  await page.goto('/stat');
  await waitForStatReady(page);

  await expectNoA11yViolations(page);
});

test('a11y: /missing has no axe violations and keyboard flow works', async ({ page }) => {
  await page.goto('/missing');
  await waitForMissingReady(page);

  await expectNoA11yViolations(page);

  const shareButton = page.getByRole('button', {
    name: /Share missing stickers|Compartilhar figurinhas faltantes|Compartir figuritas faltantes/i
  });
  await shareButton.focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(
    (url) => url.pathname === '/share' && url.searchParams.get('from') === '/missing'
  );
});

test('a11y: dark theme key pages have no axe violations', async ({ page }) => {
  // Store dark theme, reload so app reads it and applies data-theme="dark"
  await page.goto('/');
  await waitForHomeReady(page);
  await setDarkTheme(page);
  await expectNoA11yViolations(page);

  await openHomeMenu(page);
  await expect(page.locator('[role="dialog"][aria-labelledby="menu-drawer-title"]')).toBeVisible();
  await page.waitForTimeout(250);
  await expectNoA11yViolations(page);

  // Navigate directly — app reads stored 'dark' theme automatically
  await page.goto('/album/A/mex');
  await waitForAlbumReady(page);
  await expectNoA11yViolations(page);

  await page.goto('/stat');
  await waitForStatReady(page);
  await expectNoA11yViolations(page);

  await page.goto('/missing');
  await waitForMissingReady(page);
  await expectNoA11yViolations(page);
});

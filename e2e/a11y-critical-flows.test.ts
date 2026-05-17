import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { openHomeMenu, waitForMainContent } from './utils/journey-helpers';

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
    document.body.setAttribute('data-theme', 'dark');
  });
}

test('a11y: home page has no axe violations', async ({ page }) => {
  await page.goto('/');
  await waitForMainContent(page);

  await expectNoA11yViolations(page);
});

test('a11y: home drawer open has no axe violations and keyboard flow works', async ({ page }) => {
  await page.goto('/');
  await waitForMainContent(page);

  await openHomeMenu(page);
  const drawerDialog = page.locator('[role="dialog"][aria-labelledby="menu-drawer-title"]');
  const drawerCloseButton = drawerDialog.getByRole('button', { name: /Close|Cerrar|Fechar/i });
  await expect(drawerDialog).toBeVisible();

  await expect(page.getByRole('button', { name: /Language|Idioma/ })).toBeVisible();
  await expect(drawerDialog).toContainText(/Share|Compartir|Compartilhar/);

  // Focus must move inside dialog after opening.
  await expect(drawerCloseButton).toBeFocused();

  await expectNoA11yViolations(page);

  // ESC must close dialog.
  await page.keyboard.press('Escape');
  await expect(drawerDialog).toBeHidden();
});

test('a11y: special album page has no axe violations', async ({ page }) => {
  await page.goto('/album/fwc-opening');
  await waitForMainContent(page);

  await expectNoA11yViolations(page);
});

test('a11y: team album page has no axe violations', async ({ page }) => {
  await page.goto('/album/A/mex');
  await waitForMainContent(page);

  await expectNoA11yViolations(page);
});

test('a11y: scanner idle has no axe violations', async ({ page }) => {
  await page.goto('/scanner');
  await waitForMainContent(page);
  await expect(page.getByTestId('scanner-cta-button')).toBeVisible();

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
  await waitForMainContent(page);
  await page.getByTestId('scanner-cta-button').click();
  await page.waitForSelector('[data-testid="scanner-video"]', { timeout: 10000 });

  await expectNoA11yViolations(page);
});

test('a11y: share selection from home drawer has no axe violations', async ({ page }) => {
  await page.goto('/');
  await waitForMainContent(page);

  await openHomeMenu(page);
  await page
    .getByRole('button', { name: /Share Missing|Compartir Faltantes|Compartilhar Faltantes/ })
    .click();
  await page.waitForURL(/\/share(?:\?.*)?$/);

  await expect(page.locator('[role="dialog"][aria-labelledby="menu-drawer-title"]')).toBeHidden();

  await expectNoA11yViolations(page);
});

test('a11y: share preview has no axe violations', async ({ page }) => {
  await page.goto('/share');
  await waitForMainContent(page);

  const firstCheckbox = page.locator('input[type="checkbox"]').first();
  await firstCheckbox.check();

  await page.getByRole('button', { name: /Generate Image|Generar Imagen|Gerar Imagem/ }).click();
  await page.waitForURL(/\/share\/preview(?:\?.*)?$/);

  await expectNoA11yViolations(page);
});

test('a11y: dark theme key pages have no axe violations', async ({ page }) => {
  await page.goto('/');
  await waitForMainContent(page);
  await setDarkTheme(page);
  await expectNoA11yViolations(page);

  await openHomeMenu(page);
  await expect(page.locator('[role="dialog"][aria-labelledby="menu-drawer-title"]')).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto('/album/A/mex');
  await waitForMainContent(page);
  await setDarkTheme(page);
  await expectNoA11yViolations(page);
});

## Task Analysis

- Main objective: Deliver Epic STR-33 "EP9: Quality, Accessibility, CI/CD + Cloudflare Pages Hardening" by finishing STR-34 accessibility coverage, STR-35 collector-journey E2E coverage, and STR-36 validation-only CI/Cloudflare alignment without unnecessary workflow churn.
- Identified dependencies:
  - Epic order dependency: STR-34 first, STR-35 second, STR-36 last. Reason: axe-driven accessibility fixes can change DOM semantics and selectors that later collector-journey tests depend on.
  - Existing Playwright foundation already matches user constraints: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/playwright.config.ts` uses `testDir: './e2e'`, `fullyParallel: false`, and both `chromium` + `webkit` projects.
  - Existing focused E2E patterns to reuse: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-menu-drawer.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/welcome-message.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/album-toggle-persistence.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/collection-filter-persistence.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/swipe-navigation.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/quick-navigation-picker.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/scanner-flow.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/scanner-permission.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/backup-restore.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/delete-app-data.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/not-found-page.test.ts`.
  - Existing browser/component coverage should remain source of truth for native-API edge cases that are harder to stabilize E2E: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/BackupRestoreSheet.browser.test.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/scanner/ScannerScreen.browser.test.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/share/ShareSelectionScreen.browser.test.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/share/SharePreviewScreen.browser.test.tsx`.
  - New NPM package to install: add `@axe-core/playwright` as a dev dependency in `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/package.json` and update `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/pnpm-lock.yaml`. Use `pnpm add -D @axe-core/playwright`; `save-prefix=~` is already enforced by repo config.
  - Likely UI fix surface, if axe finds issues:
    - Home + drawer: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeHeroProgress.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeSpecialCards.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`.
    - Album viewer: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumViewer.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/PageProgress.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/StickerCell.tsx`.
    - Scanner: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/scanner/ScannerScreen.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/scanner/ScanResultPopup.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/scanner/ReviewModal.tsx`.
    - Share flow: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/share/index.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/share/preview.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/ShareSelectionScreen.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/SharePreviewScreen.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/SharePreviewCard.tsx`.
  - Inspect-only pipeline files for STR-36: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/ci.yml`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/release.yml`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/preview-release-pr.yml`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/deploy-production.yml`.
  - Plan file: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-33 EP9: Quality, Accessibility, CI／CD + Cloudflare Pages Hardening.md`.
- System impact:
  - Test layer: add one focused Playwright a11y suite and two focused collector-journey suites while preserving repo convention of small `.test.ts` files under `e2e/`.
  - UI layer: only targeted semantic/focus/label/contrast fixes discovered by axe should land; no new provider, router, or state architecture is needed.
  - Delivery pipeline: no planned CI/Cloudflare edits because current repo already builds `dist/client`, uploads artifacts, and deploys Pages through `wrangler-action`; STR-36 should remain validation-only unless the new coverage exposes a real mismatch.

## Chosen Approach

- Proposed solution:
  - Task 1 — STR-34 Accessibility coverage for critical UI flows
    - Description: add one Playwright suite with `@axe-core/playwright` to audit stable critical states across Chromium and WebKit, then fix only real violations surfaced by those audits.
    - Files to create:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/a11y-critical-flows.test.ts`
    - Files to modify:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/package.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/pnpm-lock.yaml`
      - Only the smallest relevant UI files from the critical-flow component list above after axe reports real failures.
    - Test scenarios to cover:
      1. Home page `/` loads with zero axe violations.
      2. Home drawer open state has zero axe violations.
      3. Special album page `/album/fwc-opening` has zero axe violations.
      4. Team album page `/album/A/mex` has zero axe violations.
      5. Scanner idle route `/scanner` has zero axe violations in Chromium and WebKit.
      6. Share selection route `/share` reached from the home drawer has zero axe violations.
      7. Share preview route `/share/preview` reached through the real selection flow has zero axe violations.
      8. Optional Chromium-only follow-up for deeper mocked scanner states if the idle audit leaves semantic risk uncovered; do not block the whole epic on known WebKit camera-mock instability.
  - Task 2 — STR-35 End-to-end coverage for core collector journeys
    - Description: fill current collector-flow gaps with two new E2E files instead of expanding one giant suite. Keep existing tests intact unless a tiny selector dedupe becomes necessary.
    - Files to create:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-progress-journeys.test.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/team-page-journeys.test.ts`
    - Files to modify:
      - Prefer no existing E2E-file rewrites. Only touch current files if a tiny helper extraction or regression assertion clearly reduces duplication without introducing a shared fixture layer.
    - Test scenarios to cover:
      1. Home page shows hero progress, opening special section, Groups section, remaining Special Pages section, and all 12 group cards (A-L).
      2. Representative team tiles are visible inside the home groups list.
      3. Drawer menu exposes stable collector actions: Share, Scanner (when feature flag is enabled), Language, Theme, Backup & Restore, and Delete App Data. Do not assert the conditional PWA install row because it varies by platform state.
      4. Navigating from home into a representative team page works through user-visible controls, not only deep links.
      5. Team page header shows the correct team and group metadata.
      6. Marking stickers as "have" updates page-level progress immediately.
      7. Returning home after sticker changes updates global hero progress and the affected section counter/progress.
      8. Reload keeps collected stickers visible as pressed and preserves progress values.
      9. Unmarking a previously collected sticker decrements counts again.
      10. Both album route shapes stay covered: special page `/album/fwc-opening` and team page `/album/A/mex`.
  - Task 3 — STR-36 Finalize CI/CD and Cloudflare Pages alignment
    - Description: treat STR-36 as validation-only because current repo already satisfies the requested CI/deploy shape.
    - Files to inspect only:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/playwright.config.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/ci.yml`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/release.yml`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/preview-release-pr.yml`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/deploy-production.yml`
    - Validation targets:
      - `pnpm test:e2e` remains the single E2E script.
      - GitHub Actions CI already separates `full_checks` and conditional `e2e_tests`.
      - CI uploads `dist/client`, release archives `dist/`, and both preview + production deploy workflows use `wrangler-action` to deploy `dist/client` to Cloudflare Pages.
      - No workflow edits should be made unless the new tests expose a proven mismatch.
- Justification for simplicity:
  - Reuses current repo convention of small, route-focused Playwright files under `e2e/` instead of introducing a custom fixture framework or a giant “all quality” suite.
  - Keeps all browser targets inside existing `playwright.config.ts`; no parallel a11y runner or extra CI job is needed.
  - Uses stable user flows for a11y coverage and leaves harder native API edge cases in the component/browser test layer where the repo already handles them well.
  - Avoids touching already-solid CI/Cloudflare workflows just to “do something” for STR-36.
- Components to be modified/created:
  - New files:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/a11y-critical-flows.test.ts`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-progress-journeys.test.ts`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/team-page-journeys.test.ts`
  - Dependency files:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/package.json`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/pnpm-lock.yaml`
  - Conditional UI-fix files, depending on actual axe findings:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeHeroProgress.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeSpecialCards.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumViewer.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/PageProgress.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/StickerCell.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/scanner/ScannerScreen.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/scanner/ScanResultPopup.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/scanner/ReviewModal.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/share/index.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/share/preview.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/ShareSelectionScreen.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/SharePreviewScreen.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/SharePreviewCard.tsx`
  - Inspect-only, no-change-expected files:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/playwright.config.ts`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/ci.yml`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/release.yml`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/preview-release-pr.yml`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/.github/workflows/deploy-production.yml`

## Implementation Steps

1. Baseline repo and lock assumptions before adding new coverage.
   - Reconfirm current Playwright conventions from `playwright.config.ts` and existing `e2e/*.test.ts` files: direct `@playwright/test` imports, role-first selectors, and partial CSS selectors for sticker-grid fallbacks.
   - Reconfirm STR-36 remains validation-only by checking that `ci.yml`, `release.yml`, `preview-release-pr.yml`, and `deploy-production.yml` all agree on the build/deploy artifact flow.
   - Pre-implementation correctness check: if current `pnpm test:e2e` already fails on unrelated issues, stop and isolate those first instead of stacking new test work on top.
2. Install the a11y dependency with zero config churn.
   - Add `@axe-core/playwright` to `devDependencies` in `package.json` and update `pnpm-lock.yaml`.
   - Keep `test:e2e` and `playwright.config.ts` unchanged unless the package exposes a hard compatibility problem.
   - Rollback / mitigation: if the package version conflicts with current Playwright packages, solve it at dependency level only; do not create a second E2E script or fork the config.
3. Implement STR-34 first with one focused `e2e/a11y-critical-flows.test.ts` suite.
   - Use `import { expect, test } from '@playwright/test'` plus `AxeBuilder` from `@axe-core/playwright` to match repo style.
   - Add only file-local helpers inside `e2e/a11y-critical-flows.test.ts` for repeated `AxeBuilder` setup and route preparation. Do not create a shared E2E support framework unless at least three files need identical logic.
   - Cover, in this order:
     1. home `/`
     2. open drawer on home
     3. special album page `/album/fwc-opening`
     4. team album page `/album/A/mex`
     5. scanner idle `/scanner`
     6. share selection reached from the home drawer
     7. share preview reached after selecting pages and clicking generate
   - Apply the smallest possible accessibility remediations in the exact components flagged by axe.
   - During-implementation checkpoint: keep scanner coverage cross-browser on the idle state even if active-camera mocks remain flaky in WebKit; deeper mocked scanner-state audits may be Chromium-only but must be documented narrowly.
4. Implement STR-35 home/progress journey coverage in `e2e/home-progress-journeys.test.ts`.
   - Add happy-path assertions for the home information architecture: hero progress, opening special section, Groups section, other Special Pages section, and all 12 group cards A-L.
   - Add visibility assertions for representative team tiles within the group list.
   - Add drawer-option assertions for stable collector actions only: Share, Scanner when enabled, Language, Theme, Backup & Restore, Delete App Data.
   - Add a route-driven user journey from home into a representative page using visible UI controls.
   - Add a progress-propagation journey: toggle one or more stickers, return home, and verify both global hero progress and the affected section summary change.
   - Rollback / mitigation: if absolute progress numbers are brittle across locales or data tweaks, assert deltas/change in stats instead of hard-coded full totals.
5. Implement STR-35 team-page journey coverage in `e2e/team-page-journeys.test.ts`.
   - Add a representative team-page happy path on `/album/A/mex` to validate header team/group metadata, sticker grid visibility, and progressbar behavior.
   - Add persistence assertions: collected stickers remain `aria-pressed="true"` after reload and progress values stay synced.
   - Add unmark/decrement coverage so the suite proves both directions of the collector flow.
   - Add special-page regression coverage on `/album/fwc-opening` so both album route shapes remain exercised after new assertions land.
   - During-implementation checkpoint: keep helpers local to the file unless duplication genuinely justifies a shared abstraction.
6. Validate whole epic and leave STR-36 untouched unless a real mismatch appears.
   - Run targeted cross-browser checks first:
     - `pnpm exec playwright test e2e/a11y-critical-flows.test.ts --project=chromium`
     - `pnpm exec playwright test e2e/a11y-critical-flows.test.ts --project=webkit`
     - `pnpm exec playwright test e2e/home-progress-journeys.test.ts --project=chromium`
     - `pnpm exec playwright test e2e/home-progress-journeys.test.ts --project=webkit`
     - `pnpm exec playwright test e2e/team-page-journeys.test.ts --project=chromium`
     - `pnpm exec playwright test e2e/team-page-journeys.test.ts --project=webkit`
   - Then run repo-level verification:
     - `pnpm test:e2e`
     - `pnpm complete-check`
   - Final STR-36 gate: confirm workflow files still need no edits after the new tests land. If a real CI/Pages gap appears, document it as a follow-up instead of silently broadening implementation scope.

## Validation

- Success criteria:
  - `@axe-core/playwright` is installed with only `package.json` and `pnpm-lock.yaml` dependency changes.
  - `e2e/a11y-critical-flows.test.ts` passes on Chromium and WebKit for stable critical flows: home, drawer, album viewer, scanner idle, share selection, and share preview.
  - New collector-journey coverage proves all requested behaviors: home sections/teams visibility, global progress updates, page progress updates, drawer menu options, correct team-page header/group metadata, sticker visibility, and reload persistence.
  - Existing E2E suites continue passing; `pnpm complete-check` stays green; no coverage-threshold changes and no CI-script multiplication.
  - `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/preview-release-pr.yml`, and `.github/workflows/deploy-production.yml` remain unchanged unless a concrete alignment bug is discovered.
- Checkpoints:
  - Pre-implementation assumptions check:
    - `playwright.config.ts` still targets Chromium + WebKit and current baseline `pnpm test:e2e` is not already red from unrelated breakage.
    - CI/deploy inspection confirms `dist/client` remains the shared Cloudflare Pages artifact path.
  - During-implementation correctness checks:
    - After Step 3, each critical-flow audit produces actionable axe output before fixes and zero violations after fixes; scanner idle remains the mandatory cross-browser state if deeper scanner mocks are unstable.
    - After Step 4, home/progress tests prove a user-visible state change from sticker toggles back on the home screen, not only inside the current page.
    - After Step 5, team-page tests prove both increment and decrement behavior plus reload persistence.
  - Post-implementation verification and regression checks:
    - Targeted Chromium and WebKit runs pass for all new files.
    - Full `pnpm test:e2e` passes with old and new suites together.
    - Final `pnpm complete-check` passes.
    - No workflow or deploy-file diffs exist unless a proven STR-36 mismatch forced a follow-up.

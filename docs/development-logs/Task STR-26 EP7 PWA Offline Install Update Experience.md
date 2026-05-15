---
title: STR-26 EP7 PWA Offline Install Update Experience
type: development-log
permalink: docs/development-logs/task-STR-26-ep7-pwa-offline-install-update-experience
---

# Development Log: STR-26

## Metadata

- Task ID: STR-26
- Date (UTC): 2026-05-15T12:00:00Z
- Project: sticker-tracker
- Branch: feature/str-26-ep7-pwa-offline-install-update-experience
- Commit: n/a (pre-commit)

## Objective

Implement PWA foundation for Sticker Tracker: service worker with Workbox runtime caching, platform-aware install UX (Chromium banner + iOS guidance), and service worker update flow with user-triggered reload.

## Implementation Summary

Delivered 3 subtasks in dependency order:

**STR-27 — PWA manifest and Workbox integration**

- Enhanced `public/manifest.json` with installability fields (id, scope, lang, description, maskable icon purposes)
- Created `src/services/pwa-registration.ts` — manual SW registration wrapper with update detection callbacks
- Created `src/providers/PwaProvider.tsx` — React context provider managing SW registration, update availability, install state
- Added manifest and apple-touch-icon links to `__root.tsx` head
- Created `scripts/generate-sw.mjs` — postbuild script using `workbox-build.generateSW` to produce precached SW
- Configured Playwright preview server for PWA E2E testing (`PWA_E2E` env var)

**STR-28 — Install UX by platform**

- Created `src/services/pwa-install-service.ts` — pure helpers for platform detection (Chromium/iOS/unsupported), standalone mode check, visibility rules
- Created `src/components/pwa/PwaInstallBanner.tsx` — Chromium install banner with prompt/dismiss actions
- Created `src/components/pwa/PwaInstallSheet.tsx` — iOS Add to Home Screen guidance sheet with step-by-step instructions
- Updated `MenuDrawer.tsx` — added install row (Chromium: prompt install, iOS: open guidance sheet, unsupported: hidden)
- Updated `AppShell.tsx` — renders install banner and sheet globally
- Added 15+ translation keys across en/es/pt-BR locales

**STR-29 — Service worker update flow**

- Created `src/components/pwa/PwaUpdateToast.tsx` — bottom toast with "Update now" and dismiss actions, loading state to prevent double-clicks
- Extended `PwaProvider` with `isUpdateDismissed`, `dismissUpdate`, `applyUpdate`
- Update toast takes priority over install banner when both are visible
- Added 5 translation keys across en/es/pt-BR locales

## Files Changed

### New files

- `src/services/pwa-registration.ts` (SW registration wrapper)
- `src/services/pwa-install-service.ts` (platform detection helpers)
- `src/providers/PwaProvider.tsx` (PWA context provider)
- `src/components/pwa/PwaInstallBanner.tsx` (Chromium install banner)
- `src/components/pwa/PwaInstallBanner.module.css` (banner styles)
- `src/components/pwa/PwaInstallSheet.tsx` (iOS guidance sheet)
- `src/components/pwa/PwaInstallSheet.module.css` (sheet styles)
- `src/components/pwa/PwaUpdateToast.tsx` (update toast)
- `src/components/pwa/PwaUpdateToast.module.css` (toast styles)
- `scripts/generate-sw.mjs` (postbuild SW generation)
- `test/services/pwa-install-service.test.ts` (platform detection unit tests)
- `test/services/pwa-registration.test.ts` (registration unit tests)
- `test/components/pwa/PwaInstallBanner.browser.test.tsx` (banner browser tests)
- `test/components/pwa/PwaInstallSheet.browser.test.tsx` (sheet browser tests)
- `test/components/pwa/PwaUpdateToast.browser.test.tsx` (toast browser tests)

### Modified files

- `package.json` (added workbox-build devDependency, postbuild script)
- `vite.config.ts` (removed vite-plugin-pwa, kept clean config)
- `playwright.config.ts` (added PWA_E2E preview server support)
- `public/manifest.json` (added id, scope, lang, description, split icon purposes)
- `src/routes/__root.tsx` (added manifest/apple-touch-icon links, PwaProvider wrapper)
- `src/components/AppShell.tsx` (renders PWA surfaces)
- `src/components/AppShell.module.css` (toast container stacking)
- `src/components/MenuDrawer.tsx` (install row)
- `src/locales/en/translation.json` (pwa.install._, pwa.update._ keys)
- `src/locales/es/translation.json` (pwa.install._, pwa.update._ keys)
- `src/locales/pt-BR/translation.json` (pwa.install._, pwa.update._ keys)
- `test/components/AppShell.browser.test.tsx` (PWA mocks)
- `test/components/MenuDrawer.browser.test.tsx` (PWA mocks)
- `test/routes/__root.test.tsx` (manifest link assertions)

### Deleted files

- `public/sw.js` (replaced by generated SW from postbuild script)

## Key Decisions

1. **vite-plugin-pwa incompatible with TanStack Start dual build** — The plugin's generateSW/injectManifest strategies don't emit sw.js through TanStack Start's client+server build pipeline. Switched to `workbox-build.generateSW` in a postbuild script (`scripts/generate-sw.mjs`) that runs after `vite build` and produces a precached SW in `dist/client/sw.js`.

2. **Manual SW registration instead of virtual:pwa-register** — Without vite-plugin-pwa, the `virtual:pwa-register` module is unavailable. Created a thin wrapper (`pwa-registration.ts`) around `navigator.serviceWorker.register('/sw.js')` that exposes the same callback interface (onNeedRefresh, onOfflineReady) for easy mocking in tests.

3. **Install state kept in memory only** — Deferred install prompt and update availability are ephemeral browser state. No IndexedDB keys added. State resets on page reload, which is correct behavior for these concerns.

4. **Update toast takes priority over install banner** — When both `isUpdateAvailable` and `isInstallBannerVisible` are true, the update toast renders and the install banner is suppressed. Prevents UI competition for the same screen space.

5. **Workbox bundled, not CDN-loaded** — Initial implementation used `importScripts` from Google's CDN, which broke offline-first. Switched to `workbox-build` which bundles Workbox runtime into the generated SW, ensuring full offline capability.

6. **`skipWaiting: false` and `clientsClaim: false`** — Per plan constraints, the SW never auto-activates. Updates require explicit user action via the toast's "Update now" button.

## Validation Performed

- **typecheck**: `tsc --noEmit` — zero errors
- **lint**: `oxlint --fix --deny-warnings` + `stylelint` — 0 warnings, 0 errors across 115 files
- **format**: `oxfmt .` — 205 files formatted
- **unit/browser tests**: `vitest run --coverage` — 48 files, 390 tests passed
  - Coverage: Statements 87.31%, Branches 80.08%, Functions 91.39%, Lines 89.92%
- **E2E tests**: `playwright test` — 38 tests passed (chromium + webkit)
- **build**: `vite build` + postbuild — client + SSR built, 1 page prerendered, SW generated with 286 precached files (6.1MB)
- **QA gate**: `pnpm complete-check` — all 7 phases passed

## Risks and Follow-ups

1. **E2E tests for offline/install flows not created** — Plan called for `e2e/pwa-offline.test.ts` and `e2e/pwa-install.test.ts`. Current E2E suite covers existing routes but not PWA-specific flows. Follow-up: create these tests using the `PWA_E2E` preview server setup.

2. **PwaProvider browser tests not created** — The provider's state machine (8 state variables, 6 callbacks, 2 event listeners) has no deterministic test coverage. File marked with `/* v8 ignore file */`. Follow-up: create `test/providers/PwaProvider.browser.test.tsx` with mocked registration harness.

3. **iOS Safari manual verification needed** — Install guidance sheet and standalone detection cannot be fully automated. Manual QA required on real iOS Safari: verify sheet visibility, translated steps, and install UI disappearance after standalone launch.

4. **Workbox CDN version pinned in generate-sw** — The `workbox-build` npm package version determines the Workbox runtime in the SW. When updating workbox-build, verify the generated SW still works correctly and test offline behavior.

5. **Service worker precache size** — 286 files / 6.1MB precached on first load. This is acceptable for the current app size but should be monitored as the app grows. Consider lazy-loading routes if precache exceeds 10MB.

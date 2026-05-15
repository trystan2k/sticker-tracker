## Task Analysis

- Main objective: Deliver Epic STR-56 "EP13: App Preferences" by extending MenuDrawer with two app-level preferences actions — Delete App Data and Theme switching — available from Home, Album, and Not Found entry points, with persistence, i18n, and regression coverage.
- Identified dependencies:
  - STR-51 is already done and does not block this epic.
  - Existing patterns to reuse: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/LocaleSwitcher.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/lib/storage/app-storage.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/__root.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/design-tokens/dist/*.css`.
  - Supporting stack already in place: IndexedDB via `idb`, TanStack Start router navigation, i18next JSON locales, Vitest browser tests, Playwright E2E.
  - Plan file: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-56 EP13 App Preferences.md`.
- System impact:
  - UI: MenuDrawer gains Theme and Delete App Data rows; Theme uses a new bottom sheet that mirrors LocaleSwitcher; Delete uses browser-native confirm.
  - State: AppStateProvider becomes source of truth for `theme`, `setTheme`, and a public reset action so delete flow reboots app state cleanly after IndexedDB reset.
  - Persistence: `app-storage` adds a `theme` key; a new theme service reads, writes, resolves, and applies the `<html data-theme>` preference.
  - Runtime/routing: delete flow must return user to `/`; startup must re-detect locale and restore System theme when preference storage is empty.

## Chosen Approach

- Proposed solution:
  - Implement STR-53 first, then STR-52.
  - Use provider-centric preference management: expose a context reset action for delete flow and centralize theme state/actions in AppStateProvider.
  - Reuse LocaleSwitcher architecture for a dedicated ThemeSheet; keep delete UX browser-native with `window.confirm()` plus i18n translations.
- Justification for simplicity:
  - Avoids a separate preferences provider or settings screen for only two preferences.
  - Reuses existing drawer, bottom-sheet, i18n, and storage patterns already proven in repo.
  - Keeps destructive reset logic centralized so locale re-detection, theme reset-to-system, and collection clearing all happen in one bootstrap path instead of being duplicated in three screens.
- Components to be modified/created:
  - Task 1 — STR-53 Delete app data end-to-end
    - Description: Add a translated delete action to MenuDrawer, wire it from HomeScreen, AlbumPageHeader, and NotFoundPage, and route the actual storage reset through AppStateProvider so app state fully reboots after deletion.
    - Files to modify:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/not-found/NotFoundPage.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/en/translation.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/es/translation.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/pt-BR/translation.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/MenuDrawer.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/providers/AppStateProvider.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/album-viewer/AlbumPageHeader.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/not-found/NotFoundPage.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-menu-drawer.test.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/delete-app-data.test.ts` (new)
    - Test strategy: extend existing drawer/provider/screen browser tests for delete-row wiring and confirm flow; add focused Playwright delete flow coverage.
  - Task 2 — STR-52 Theme switcher end-to-end
    - Description: Add a persistent 3-state theme preference (`system`, `light`, `dark`) backed by storage and a new ThemeSheet bottom sheet that mirrors LocaleSwitcher and is reachable from the same three entry points.
    - Files to create:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/services/theme-service.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/ThemeSheet.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/ThemeSheet.module.css`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/services/theme-service.test.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/ThemeSheet.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/theme-persistence.test.ts`
    - Files to modify:
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/lib/storage/app-storage.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/not-found/NotFoundPage.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/__root.tsx` (only if theme DOM sync is kept beside `RootLanguageSync` instead of inside provider)
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/en/translation.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/es/translation.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/pt-BR/translation.json`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/storage/app-storage.browser.test.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/providers/AppStateProvider.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/MenuDrawer.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/album-viewer/AlbumPageHeader.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/not-found/NotFoundPage.browser.test.tsx`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-menu-drawer.test.ts`
      - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/locale-persistence.test.ts` (regression check)
    - Test strategy: add dedicated service + ThemeSheet browser tests, extend storage/provider/drawer/screen coverage, and add Playwright persistence validation.

## Implementation Steps

1. Task 1 — STR-53 Delete app data end-to-end
   - Description:
     - Add the App Preferences delete action in the existing drawer and route reset through a single provider-owned flow that clears IndexedDB, reboots state, and returns user to home.
   - Files to modify:
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/not-found/NotFoundPage.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/en/translation.json`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/es/translation.json`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/pt-BR/translation.json`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/MenuDrawer.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/providers/AppStateProvider.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/album-viewer/AlbumPageHeader.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/not-found/NotFoundPage.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-menu-drawer.test.ts`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/delete-app-data.test.ts`
   - Implementation steps:
     1. Add `drawer.delete_data`, `drawer.delete_confirm`, and `drawer.delete_confirm_title` to the English, Spanish, and Portuguese translation files.
     2. Extend `MenuDrawerProps` with `onOpenDeleteConfirm` and render a new drawer row after the language row using the existing `row` and `divider` structure.
     3. Expose a public `resetAppData` (or similarly named) action from AppStateProvider that wraps the existing `resetAllData()` plus `runBootstrap()` flow so the destructive storage behavior stays centralized and consistent with current error handling.
     4. Wire HomeScreen, AlbumPageHeader, and NotFoundPage to pass a delete callback that reads translated strings, calls `window.confirm()`, awaits `appState.resetAppData()` only when confirmed, and navigates to `/` after a successful reset.
     5. Verify reset semantics before moving on: collection clears, locale re-resolves from browser preferences, and theme falls back to System because no persisted theme remains after reset.
   - Test strategy:
     - Extend `test/components/MenuDrawer.browser.test.tsx` for delete-row visibility and callback dispatch.
     - Extend `test/providers/AppStateProvider.browser.test.tsx` for the public reset action and clean post-reset bootstrap state.
     - Extend `test/components/home/HomeScreen.browser.test.tsx`, `test/components/album-viewer/AlbumPageHeader.browser.test.tsx`, and `test/components/not-found/NotFoundPage.browser.test.tsx` to cover confirm-accept flow with mocked `window.confirm`.
     - Add focused Playwright coverage in `e2e/delete-app-data.test.ts` and keep `e2e/home-menu-drawer.test.ts` asserting the new row is visible.
   - Correctness checkpoint:
     - Delete action works from all three entry points and a successful reset leaves the app usable from a clean state without manual reload.
   - Rollback / mitigation:
     - If provider reset flow causes stale route/state behavior, keep the reset API centralized and delay navigation until reset resolves; do not duplicate raw `resetAllData()` calls inside each screen.

2. Task 2 — STR-52 Theme switcher end-to-end
   - Description:
     - Add a persistent theme preference with three choices (`system`, `light`, `dark`) and a ThemeSheet bottom sheet that mirrors LocaleSwitcher in structure, behavior, and styling approach.
   - Files to create:
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/services/theme-service.ts`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/ThemeSheet.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/ThemeSheet.module.css`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/services/theme-service.test.ts`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/ThemeSheet.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/theme-persistence.test.ts`
   - Files to modify:
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/lib/storage/app-storage.ts`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/not-found/NotFoundPage.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/routes/__root.tsx` (conditional — only if theme DOM sync lives beside `RootLanguageSync`)
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/en/translation.json`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/es/translation.json`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/pt-BR/translation.json`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/storage/app-storage.browser.test.ts`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/providers/AppStateProvider.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/MenuDrawer.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/album-viewer/AlbumPageHeader.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/not-found/NotFoundPage.browser.test.tsx`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-menu-drawer.test.ts`
     - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/locale-persistence.test.ts`
   - Implementation steps:
     1. Add `'theme'` to `AppStorageKey` and `AppStorageValueByKey` in `app-storage.ts`; extend browser storage tests so theme read/write/reset behavior is covered alongside locale and collection.
     2. Create `theme-service.ts` using `locale-service.ts` conventions: supported theme constant/type, storage load/save helpers, invalid-value resolver to `system`, and DOM application helper that sets `document.documentElement.dataset.theme = 'light' | 'dark'` or removes the attribute for `system`.
     3. Extend AppStateProvider context with `theme` and `setTheme`; during bootstrap, load saved theme after storage initialization, resolve it, apply it before setting render state to `ready`, and preserve existing storage error handling.
     4. Create `ThemeSheet.tsx` and `ThemeSheet.module.css` by mirroring LocaleSwitcher portal, backdrop, Escape-close, close-button, selectable rows, selected-checkmark, and token-driven CSS structure.
     5. Extend MenuDrawer with `onOpenThemeSwitcher` and add a Theme row above Delete App Data using the existing drawer-row pattern; do not introduce a separate settings page.
     6. Update HomeScreen, AlbumPageHeader, and NotFoundPage with local ThemeSheet open/close state and pass the new drawer callback so Theme uses the same three entry points as LocaleSwitcher.
     7. Choose one DOM-sync path only: either keep theme application entirely inside AppStateProvider for maximum centralization, or add a root sync effect beside `RootLanguageSync` in `src/routes/__root.tsx`. Do not apply theme in both places.
     8. Verify System mode behavior explicitly: selecting System removes the explicit `data-theme` attribute so generated token CSS falls back to `prefers-color-scheme`.
   - Test strategy:
     - Add `test/services/theme-service.test.ts` for resolve/load/save/apply behavior.
     - Extend `test/storage/app-storage.browser.test.ts` for theme persistence and reset coverage.
     - Extend `test/providers/AppStateProvider.browser.test.tsx` for startup theme loading and `setTheme`.
     - Add `test/components/ThemeSheet.browser.test.tsx` mirroring LocaleSwitcher behavior coverage.
     - Extend `test/components/MenuDrawer.browser.test.tsx`, `test/components/home/HomeScreen.browser.test.tsx`, `test/components/album-viewer/AlbumPageHeader.browser.test.tsx`, and `test/components/not-found/NotFoundPage.browser.test.tsx` for theme row and ThemeSheet wiring.
     - Add Playwright `e2e/theme-persistence.test.ts` to verify theme selection persists across reload and System removes `data-theme`.
   - Correctness checkpoint:
     - Theme can be changed from all three entry points, survives reload, and System mode restores CSS media-query behavior.
   - Rollback / mitigation:
     - If bootstrap timing causes flash or hydration mismatch, apply the resolved theme before provider `renderState` becomes `ready`; avoid async theme application inside individual screens.

3. Final regression and QA sweep
   - Run focused validation in dependency order:
     1. Browser tests for storage/provider/components touched by STR-53.
     2. Browser tests for theme service, ThemeSheet, provider, and updated screens.
     3. Playwright flows for drawer visibility, delete flow, locale persistence regression, and theme persistence.
     4. Full project QA with `pnpm complete-check`.
   - Confirm no regressions in:
     - locale switching,
     - share row enable/disable behavior,
     - drawer focus trap and Escape close,
     - album and not-found entry points,
     - post-reset bootstrap on clean storage.

## Validation

- Success criteria:
  - Plan file exists at `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-56 EP13 App Preferences.md`.
  - STR-53 is complete when MenuDrawer shows Delete App Data, confirm text is translated, accepting the dialog clears persisted app data via the provider reset path, navigates to `/`, and reboots app state cleanly.
  - STR-52 is complete when MenuDrawer shows Theme, ThemeSheet opens from Home, Album, and Not Found, theme persists in IndexedDB, `<html>` reflects `light` / `dark` / no `data-theme` for `system`, and reload preserves behavior.
  - `pnpm complete-check` passes with updated browser and E2E coverage.
- Checkpoints:
  - Pre-implementation assumptions check:
    - Reconfirm no separate settings screen is needed; only drawer rows, ThemeSheet, and browser-native confirm.
    - Reconfirm AppStateProvider owns reset and theme state so screens stay thin and consistent.
  - During-implementation correctness checks:
    - After Task 1, delete is reachable from all three entry points and the provider returns to `ready` after a successful reset.
    - After Task 2 storage/service work, writing `theme` persists and DOM application toggles or removes `data-theme` correctly.
    - After Task 2 UI work, ThemeSheet interaction matches LocaleSwitcher for portal mount, backdrop dismiss, Escape close, close button, and selected option state.
  - Post-implementation verification and regression checks:
    - Reload after selecting light or dark keeps the same theme.
    - System option removes explicit theme override and leaves media-query-driven theming in control.
    - Delete after setting locale, theme, or collection returns the app to clean startup behavior.
    - `pnpm complete-check` stays green.

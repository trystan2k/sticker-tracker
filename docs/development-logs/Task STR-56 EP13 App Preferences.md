---
title: STR-56 EP13 App Preferences
type: development-log
permalink: docs/development-logs/task-STR-56-EP13-App-Preferences
---

## Metadata

- Task ID: STR-56 (epic)
- Date: 2026-05-15
- Project: sticker-tracker
- Branch: feature/STR-56-ep13-app-preferences
- Commit: (not yet committed)
- Sub-tasks: STR-53 (Delete app data end-to-end), STR-52 (Theme switcher end-to-end)

## Objective

Add App Preferences to the MenuDrawer: Delete App Data (destructive reset with browser-native confirm) and Theme Switcher (Light/Dark/System with IndexedDB persistence).

## Implementation Summary

### STR-53: Delete App Data

- Added i18n keys for delete data (en/es/pt-BR).
- Added `onOpenDeleteConfirm` prop + Delete Data row to MenuDrawer (Trash2 icon, disabled when no callback).
- Exposed `resetAppData()` in AppStateProvider: calls `resetAllData()`, clears in-memory state, re-runs bootstrap.
- Wired all 3 entry points (Home, Album, NotFound): window.confirm → reset → navigate /.
- Focus trap updated to exclude disabled buttons (querySelector `:not([disabled])`).

### STR-52: Theme Switcher

- Created `src/services/theme-service.ts`: read/write/apply theme to IndexedDB + <html> data-theme.
- Added 'theme' key to app-storage.
- Created ThemeSheet.tsx + .module.css: bottom sheet with Light/Dark/System, mirrors LocaleSwitcher pattern.
- Added theme state to AppStateProvider, auto-apply on startup.
- Added Theme row to MenuDrawer (Palette icon).
- Wired all 3 entry points.
- Added i18n keys for theme (en/es/pt-BR).
- Updated LocaleSwitcher to use Lucide icons (X, Check) for visual consistency.

## Files Changed

Created:

- src/services/theme-service.ts — theme persistence + DOM apply service
- src/components/ThemeSheet.tsx — theme picker bottom sheet component
- src/components/ThemeSheet.module.css — theme sheet styles
- test/services/theme-service.test.ts — unit tests for readTheme/saveTheme
- test/services/theme-service.browser.test.ts — browser tests for applyTheme
- test/components/ThemeSheet.browser.test.tsx — component browser tests
- test/components/not-found/NotFoundPage.browser.test.tsx — screen tests
- e2e/theme-persistence.test.ts — E2E theme persistence tests
- e2e/delete-app-data.test.ts — E2E delete data tests

Modified:

- src/lib/storage/app-storage.ts — added 'theme' storage key
- src/providers/AppStateProvider.tsx — added theme state, setTheme, improved resetAppData
- src/components/MenuDrawer.tsx — added Theme + Delete rows, focus trap fix
- src/components/home/HomeScreen.tsx — wired Theme + Delete handlers
- src/components/album-viewer/AlbumPageHeader.tsx — wired Theme + Delete handlers
- src/components/not-found/NotFoundPage.tsx — wired Theme + Delete handlers
- src/components/LocaleSwitcher.tsx — updated to Lucide icons for consistency
- src/locales/en/translation.json — added drawer.theme, theme.\_, drawer.delete\_\_
- src/locales/es/translation.json — added translations
- src/locales/pt-BR/translation.json — added translations
- test/components/MenuDrawer.browser.test.tsx — added row props
- test/components/home/HomeScreen.browser.test.tsx — added Theme/Delete assertions
- test/components/album-viewer/AlbumPageHeader.browser.test.tsx — added Theme assertions
- test/components/LocaleSwitcher.browser.test.tsx — updated checkmark assertion
- e2e/home-menu-drawer.test.ts — added Theme/Delete row assertions

## Key Decisions

1. Theme in AppStateProvider (not separate context) — follows existing locale pattern, single provider for app-wide state.
2. ThemeSheet mirrors LocaleSwitcher — consistent bottom sheet UX, same interaction pattern.
3. Browser-native confirm for delete — per acceptance criteria, no custom dialog.
4. Provider-owned reset — centralized destructive flow avoids duplicate reset logic across 3 screens.
5. System theme removes data-theme — lets CSS media query control theme, cleanest approach.
6. Focus trap :not([disabled]) — prevents wrapping focus to disabled elements.

## Validation Performed

- QA: pnpm complete-check — ALL 8 GATES PASSED
- 374 unit/browser tests passed, 43 test files
- 38 E2E tests passed (chromium + webkit), 3 new test files
- Coverage: 88.12% stmts, 81.48% branches, 92.57% funcs, 90.92% lines
- Code review: all findings resolved
- Architecture review: all findings resolved
- Build: client + SSR + prerender passed
- Lint: oxlint 0 errors, stylelint clean

## Risks and Follow-ups

- None identified. All edge cases covered (cancel confirm, SSR guard, storage write failures, focus trap).

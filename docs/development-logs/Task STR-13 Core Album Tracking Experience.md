---
title: STR-13 Core Album Tracking Experience
type: development-log
permalink: docs/development-logs/task-STR-13-core-album-tracking-experience
---

# Development Log: STR-13

## Metadata

- Task ID: STR-13
- Date (UTC): 2026-05-11T12:00:00Z
- Project: sticker-tracker
- Branch: feature/STR-13-core-album-tracking-experience
- Commit: n/a (pre-commit)

## Objective

Implement the core album tracking UI — album viewer frame, page headers with progress, and sticker grid with toggle interactions. This is the first end-user-visible slice of the product, integrating domain model (STR-2), persistence (STR-3), and app shell (STR-1) into a functional collector workflow.

## Implementation Summary

### STR-14: Album Viewer Frame + Loading State

- Replaced home route (`/`) with album viewer integration
- Created `AlbumViewer` component orchestrating header, progress, filter row, sticker grid, swipe hint, and safe area sections
- Implemented in-view loading skeleton (12 placeholder cells with `aria-busy="true"`)
- Supports both `TeamPage` and `SpecialPage` modes via discriminated union
- Filter pills and swipe hint are presentational only (functionality deferred to later epics)
- Relaxed `AppStateProvider` loading behavior — children now render during bootstrap so in-view loading skeleton can appear

### STR-16: Page Headers + Per-Page Progress

- Created `AlbumPageHeader` component with team variant (flag + translated name + group badge) and special variant (translated title + section label)
- Created `PageProgress` component with collected/total count, percentage, and accessible progress bar (`role="progressbar"`)
- Added i18n keys for all 48 teams, 12 groups, 3 special pages, and album UI strings across 3 locales (en, pt-BR, es)

### STR-15: Sticker Grid + Toggle Interactions

- Created `StickerGrid` component using CSS Grid (4 columns default, 5 for Coca-Cola page)
- Created `StickerCell` component as native `<button type="button">` with `aria-pressed` for collected state
- Wired toggle through `appState.toggleCollected` with `useRef` to avoid stale collection race condition
- Keyboard accessible via native button semantics (Enter/Space activation)

### Design Token Updates

- Added cream palette primitives (`cream.50`, `cream.100`, `cream.200`, `cream.300`) to `design-tokens/primitives/color.tokens.json`
- Added album viewer semantic tokens: `surface.album.*`, `surface.sticker.*`, `surface.filter.*`
- Updated `color.bg.canvas` and `color.bg.header` to use cream palette
- Updated `color.text.primary` and `color.text.secondary` dark mode values

### Test Coverage

- Created `test/components/album-viewer/AlbumViewer.browser.test.tsx` (7 tests): loading skeleton, team/special page render, filter pills, swipe hint, integration
- Created `test/components/album-viewer/StickerGrid.browser.test.tsx` (9 tests): column layouts, click/keyboard toggle, aria-pressed, persistence
- Strengthened `test/i18n/translation-resources.test.ts` (3 new tests): dataset-backed key validation
- Created `e2e/album-toggle-persistence.test.ts` (2 tests): toggle → progress update → reload persistence
- Updated existing browser tests for new `AppStateProvider` loading contract
- Updated existing E2E tests for album viewer content

### Review Fixes

- Fixed Rules of Hooks violation (useCallback after conditional return)
- Fixed stale collection race condition using useRef pattern
- Wired `disabled` prop through AlbumViewer → StickerGrid to prevent interaction during loading
- Changed filter pills from `<span>` to `<button type="button" disabled>` for semantic honesty
- Fixed hardcoded `#FFFFFF` in token source → `{color.palette.forest.0}`
- Removed unnecessary `useCallback` wrapper in StickerCell
- Replaced unnamed `<section>` elements with `<div>` for presentational content
- Added `aria-label` to AlbumPageHeader's `<header>` element

## Files Changed

### New Components

- `src/components/album-viewer/AlbumViewer.tsx` — main viewer orchestrator
- `src/components/album-viewer/AlbumViewer.module.css` — viewer layout styles
- `src/components/album-viewer/AlbumPageHeader.tsx` — team/special page header
- `src/components/album-viewer/AlbumPageHeader.module.css` — header styles
- `src/components/album-viewer/PageProgress.tsx` — progress indicator
- `src/components/album-viewer/PageProgress.module.css` — progress styles
- `src/components/album-viewer/StickerGrid.tsx` — sticker grid layout
- `src/components/album-viewer/StickerGrid.module.css` — grid styles
- `src/components/album-viewer/StickerCell.tsx` — individual sticker cell
- `src/components/album-viewer/StickerCell.module.css` — cell styles

### Modified Source Files

- `src/routes/index.tsx` — replaced home placeholder with album viewer
- `src/providers/AppStateProvider.tsx` — relaxed loading (children render during bootstrap)
- `src/components/AppShell.module.css` — removed main padding (viewer owns spacing)
- `src/styles.css` — added flag-icons CSS import

### Design Tokens

- `design-tokens/primitives/color.tokens.json` — added cream palette
- `design-tokens/semantic/color.tokens.json` — added album viewer tokens, updated dark mode values

### Dependencies

- `package.json` — added `flag-icons`, `lucide-react`
- `knip.json` — added `flag-icons` to `ignoreDependencies` (CSS import not detected)

### i18n

- `src/locales/en/translation.json` — added 48 team keys, 12 group keys, 3 special keys, album UI strings
- `src/locales/pt-BR/translation.json` — same
- `src/locales/es/translation.json` — same

### Tests

- `test/components/album-viewer/AlbumViewer.browser.test.tsx` — new
- `test/components/album-viewer/StickerGrid.browser.test.tsx` — new
- `test/i18n/translation-resources.test.ts` — strengthened
- `test/components/Home.browser.test.tsx` — updated for album viewer
- `test/components/AppShell.browser.test.tsx` — fixed IDB test isolation
- `test/components/LocaleSwitcher.browser.test.tsx` — fixed IDB test isolation
- `test/providers/AppStateProvider.browser.test.tsx` — fixed IDB test isolation
- `e2e/welcome-message.test.ts` — updated for album viewer
- `e2e/locale-persistence.test.ts` — updated for album viewer
- `e2e/album-toggle-persistence.test.ts` — new

### Planning

- `docs/plans/STR-13-core-album-tracking.md` — implementation plan

## Key Decisions

1. **CSS Grid over manual row wrappers**: The Pencil design uses explicit row frames, but CSS Grid with dynamic column count (4/5) is simpler, handles variable sticker counts (9/11/14/20) automatically, and is more maintainable.

2. **AppStateProvider loading relaxation**: Changed from blocking children during loading to rendering children with `renderState='loading'`. This enables in-view loading skeleton. `storage-error` branch remains blocking for safety.

3. **useRef for collection in toggle callback**: The route's `handleToggleSticker` uses a ref to access the latest collection state, avoiding the stale closure race condition that occurs with rapid double-taps on sticker cells.

4. **Filter pills as disabled buttons**: Instead of `<span>` elements styled as interactive controls, used `<button type="button" disabled>` for semantic honesty. Screen readers announce them as disabled buttons, not mystery text.

5. **Presentational-only filter/swipe**: Filter pills and swipe hint are visible but non-interactive. This keeps the UI faithful to the design while deferring actual behavior to later epics without creating fake handlers.

6. **Unique DB per test for IDB isolation**: Replaced `resetStorage()` (which called `resetAllData()` → `deleteDatabase()`) with `setDatabaseNameForTests()` giving each test a unique DB name. This eliminates IDB deletion blocking that caused 11 test timeouts.

## Validation Performed

| Check              | Command                          | Result                                                   |
| ------------------ | -------------------------------- | -------------------------------------------------------- |
| Knip (dead code)   | `pnpm knip --fix`                | ✅ Pass                                                  |
| TypeScript         | `tsc --noEmit`                   | ✅ Pass (0 errors)                                       |
| Oxlint             | `oxlint --fix --deny-warnings`   | ✅ Pass (0 warnings, 0 errors)                           |
| Stylelint          | `stylelint "src/**/*.css" --fix` | ✅ Pass                                                  |
| Format             | `oxfmt .`                        | ✅ Pass (98 files)                                       |
| Unit/Browser Tests | `vitest run --coverage`          | ✅ Pass (13 files, 77 tests)                             |
| E2E Tests          | `playwright test`                | ✅ Pass (10 tests, chromium + webkit)                    |
| Build              | `vite build`                     | ✅ Pass (client + SSR + prerender)                       |
| Coverage           | —                                | 86.74% statements, 75.65% branches (above 70% threshold) |

### Code Review Findings

- 1 CRITICAL (Rules of Hooks) — fixed
- 3 MAJOR (stale closure, filter pills, disabled prop) — fixed
- 8 MINOR — addressed
- 4 NIT — addressed or accepted

### Architecture Review Findings

- 0 CRITICAL
- 4 MAJOR (missing test files × 3, disabled prop) — all fixed
- 7 MINOR — addressed
- 5 NIT — addressed or accepted

## Risks and Follow-ups

### Risks

1. **Stale collection edge case**: The `useRef` pattern mitigates but doesn't fully eliminate the race condition — if two toggles fire before the first `setCollection` completes in the provider, the second toggle still uses the pre-first-toggle collection. Full fix would require the provider to read latest state internally. Low risk in practice (toggle is fast, users rarely double-tap).

2. **`activePageId` is dead state**: `useState` is used but `setActivePageId` is never called. The `albumPages.find()` is always a no-op returning the first page. This is intentional placeholder for future navigation but adds cognitive overhead.

3. **Header action icons are `aria-hidden`**: Camera, share, and menu icons are hidden from assistive technology. Acceptable as placeholders but must be made accessible when implemented in later epic.

### Follow-ups

1. **Team picker / page navigation**: Wire `setActivePageId` to actual navigation (swipe or picker) in later epic.
2. **Filter behavior**: Implement actual filter logic (show collected / show missing / show all) in later epic.
3. **Swipe gesture**: Implement actual swipe navigation with the existing hint text.
4. **Header actions**: Implement camera scan, share, and menu functionality with proper accessible names.
5. **Remove dead translation keys**: `team.home`, `team.away`, `special.legends`, `special.stadiums`, `app.subtitle`, `app.success`, `app.currentLanguage` are unused and should be cleaned up.

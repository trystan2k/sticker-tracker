---
title: STR-79 EP17 Missing Stickers Page
type: development-log
permalink: docs/development-logs/task-str-79-ep17-missing-stickers-page
---

# Development Log: STR-79

## Metadata

- Task ID: STR-79
- Date (UTC): 2026-05-22T14:40:00Z
- Project: sticker-tracker
- Branch: feature/STR-79-missing-stickers-page
- Commit: staged (not yet committed on branch)

## Objective

- Deliver EP17 Missing Stickers Page: a new `/missing` route showing only pages with uncollected stickers, with inline collect-to-mark interactions, optimistic UI with focus management, progress summary, share integration, drawer entry, accessibility, and full test coverage. Includes S10 Pencil parity refinement via live browser compare, ES locale terminology fixes (figuritas → cromos), devtools gating, consent banner hydration fix, and `pnpm complete-check` passing.

## Implementation Summary

### Sub-task STR-83 — Route shell and derived missing state

- Created `src/routes/missing.tsx` — TanStack Start `createFileRoute('/missing')` route component. Reads `AppStateContext`, returns `null` until `renderState === 'ready'`, builds missing view model via `buildMissingState()`, passes collection + handlers to `MissingScreen`. Uses `useRef` for collection snapshot to avoid stale closure in async toggle. Share handler encodes share selection via `encodeShareSelection` and navigates to `/share` with `from: '/missing'`.
- Created `src/components/missing/missing-state.ts` — pure adapter layer computing derived missing state from `CollectionState`. Iterates `albumPages`, filters pages with at least one uncollected (non-hidden) sticker, produces `MissingPageBlock` with page metadata + missing sticker IDs. Returns discriminated union: `all-complete` (zero missing pages) or `ready` (pages with missing stickers). `sharePageIds` derived as all page IDs with missing stickers for one-tap share integration. Supports `hiddenStickerIds` option for optimistic UI.

### Sub-task STR-82 — Missing screen UI, interactions, a11y, focus, toast

- Created `src/components/missing/MissingScreen.tsx` (453 lines) — full screen component with:
  - Header: back arrow, title, conditional share button (hidden on `all-complete` state).
  - Progress section: collected/total count + missing count with locale-aware `Intl.NumberFormat`, native `<progress>` bar.
  - Intro section: title + description explaining filter behavior.
  - Page blocks: each block shows flag/icon, team/special title, group badge, missing/total count, 4-column sticker grid.
  - Sticker buttons: code + number display, click-to-collect with optimistic hide, pending state disables button.
  - Empty state: centered "Album complete" with back-home button, `aria-live="polite"` for screen reader announcement.
  - Toast: success confirmation reusing scanner's `scanner.review.success` key, 1800ms timeout, positioned above footer.
  - Focus management: `getNextFocusTarget()` computes next focus destination after sticker collect (next sticker in block → next block's first sticker → back button or empty-state button). Uses `data-missing-sticker-id` attribute for DOM queries.
  - Optimistic UI: sticker hidden immediately via `hiddenStickerIds` set, rolled back on error/non-ready result. `pendingRef` tracks in-flight operations preventing double-tap.
  - `getStickerCodeAndNumber()`: formats sticker labels with team album code or special codes (CC, FWC), zero-padded numbers.
  - `getPageDisplayTitle()`: special handling for FWC pages showing `missing.block.fwcCode`.
- Created `src/components/missing/MissingScreen.module.css` (354 lines) — token-only CSS module. All colors, spacing, typography, radii from CSS variable tokens. Sticker cells use `:has(.stickerCell:disabled)` for opacity-0 hide animation. Focus-visible outlines on all interactive elements. Safe area footer with home indicator and toast positioning.

### Sub-task STR-81 — Drawer entry and share integration

- Extended `src/components/MenuDrawer.tsx` — added `onOpenMissing` prop, `ListMinus` icon, new "Missing Stickers" menu row with divider. Placed between Share and Scanner entries.
- Updated `src/components/home/HomeScreen.tsx` — added `handleOpenMissing` navigating to `/missing`, wired to `MenuDrawer`.
- Updated `src/components/album-viewer/AlbumPageHeader.tsx` — added `handleOpenMissing` navigating to `/missing`, wired to `MenuDrawer`.
- Updated `src/components/not-found/NotFoundPage.tsx` — added both `handleOpenShare` (using `buildInitialShareSelection` with `all-missing` type) and `handleOpenMissing`, wired to `MenuDrawer`. Previously missing share integration on 404 page.

### Sub-task STR-80 — Regression, tests, a11y, analytics alignment

- Created `test/components/missing/missing-state.test.ts` (108 lines) — unit tests for `buildMissingState`: all-collected returns `all-complete`, partial collection returns `ready` with correct page blocks, hidden sticker IDs filtered, empty collection returns all pages as missing, `sharePageIds` matches pages with missing stickers.
- Created `test/components/missing/MissingScreen.browser.test.tsx` (429 lines) — browser tests: header/back button rendering, share button visible on `ready` state, share button hidden on `all-complete`, progress bar attributes, sticker grid rendering per page type, collect sticker flow with optimistic hide, toast appears after collect, focus moves to next sticker after collect, empty state renders on all-complete, keyboard navigation.
- Created `test/routes/missing.browser.test.tsx` (306 lines) — browser route tests: route renders missing screen, share navigation with correct search params, back navigation to home, drawer entry from home, drawer entry from album page header.
- Updated `test/components/MenuDrawer.browser.test.tsx` (64 lines added) — tests for "Missing Stickers" button visible in drawer, click navigates to `/missing`.
- Created `e2e/missing-page-journeys.test.ts` (44 lines) — E2E journey: Home → drawer → Missing Stickers → page blocks visible → collect sticker → toast visible → share button → navigates to `/share` with `from=/missing`.
- Updated `e2e/a11y-critical-flows.test.ts` (29 lines added) — `/missing` axe violations test with keyboard share flow, dark theme `/missing` axe violations test.
- Updated `e2e/home-menu-drawer.test.ts` (3 lines added) — "Missing Stickers" button visible in drawer assertion.

### S10 Pencil parity refinement

- Updated `docs/design/sticker-tracker.pen` (+116 lines) — S10 screen design refined based on live browser compare. Adjusted spacing, sticker cell proportions, block header alignment, and progress section to match implemented tokens.

### QA/review fix loops

- **ES locale terminology fix**: replaced "figuritas" with "cromos" across `src/locales/es/translation.json` — stats section labels (mostStickers, lessStickers), scanner section (idleTitle, idleDescription, readyToScan, popup.stickerNumber, review.title, review.description, review.stickerLabel, review.unknownSticker), empty state description. Consistent with album terminology.
- **Consent banner hydration fix**: `AnalyticsConsentBanner.tsx` — added `hasMounted` state guard. Reads consent from `localStorage` only after mount to prevent SSR/client hydration mismatch. Returns `null` until mounted even if consent is `unknown`.
- **Devtools gating**: `src/routes/__root.tsx` — TanStack Devtools now conditionally rendered via `showDevtools` state, activated only in DEV mode with `?devtools=1` query param or `sticker-tracker.devtools` localStorage flag. Prevents devtools bundle in production and avoids hydration issues.
- **Token cleanup**: verified all CSS values in `MissingScreen.module.css` use existing design tokens, no hardcoded colors/spacing/radii.

## Files Changed

### New files (created)

- `src/routes/missing.tsx` — `/missing` route shell with share integration and back navigation (STR-83)
- `src/components/missing/MissingScreen.tsx` — S10 missing screen component with collect interactions, focus management, toast (STR-82)
- `src/components/missing/MissingScreen.module.css` — token-based CSS module for missing screen (STR-82)
- `src/components/missing/missing-state.ts` — pure missing state adapter consuming collection + album data (STR-83)
- `docs/plan/Plan STR-79 EP17: Missing Stickers Page.md` — implementation plan document (STR-79)
- `test/components/missing/missing-state.test.ts` — unit tests for missing state adapter (STR-80)
- `test/components/missing/MissingScreen.browser.test.tsx` — browser tests for missing screen UI/interactions (STR-80)
- `test/routes/missing.browser.test.tsx` — browser tests for missing route navigation/share (STR-80)
- `e2e/missing-page-journeys.test.ts` — E2E journey for missing page full flow (STR-80)

### Modified files

- `src/components/MenuDrawer.tsx` — added `onOpenMissing` prop, `ListMinus` icon, "Missing Stickers" menu row (STR-81)
- `src/components/home/HomeScreen.tsx` — `handleOpenMissing` navigation handler wired to drawer (STR-81)
- `src/components/album-viewer/AlbumPageHeader.tsx` — `handleOpenMissing` navigation handler wired to drawer (STR-81)
- `src/components/not-found/NotFoundPage.tsx` — added `handleOpenShare` (all-missing) and `handleOpenMissing` to drawer (STR-81)
- `src/components/analytics/AnalyticsConsentBanner.tsx` — hydration fix with `hasMounted` guard (STR-80)
- `src/routes/__root.tsx` — devtools conditional rendering with query/localStorage flags (STR-80)
- `src/locales/en/translation.json` — `missing.*` namespace keys + `drawer.missing` (STR-82)
- `src/locales/es/translation.json` — `missing.*` namespace keys + `drawer.missing` + figuritas→cromos terminology fix (STR-82, STR-80)
- `src/locales/pt-BR/translation.json` — `missing.*` namespace keys + `drawer.missing` (STR-82)
- `src/routeTree.gen.ts` — auto-regenerated by TanStack (STR-83)
- `test/components/MenuDrawer.browser.test.tsx` — missing stickers drawer entry tests (STR-80)
- `e2e/a11y-critical-flows.test.ts` — `/missing` axe + keyboard tests, dark theme `/missing` test (STR-80)
- `e2e/home-menu-drawer.test.ts` — "Missing Stickers" button visible assertion (STR-80)
- `docs/design/sticker-tracker.pen` — S10 Pencil parity refinement (STR-79)

## Key Decisions

- **Optimistic hide with `hiddenStickerIds` set**: stickers disappear immediately on collect tap, rolled back on error. Avoids jarring re-fetch lag. Set reconciled against base state on collection change to prevent stale entries.
- **Focus management after collect**: `getNextFocusTarget()` computes next focus destination using state page/sticker index, not DOM order. Handles last sticker in block → next block → back button fallback. Prevents focus loss after optimistic removal.
- **Discriminated union state type**: `MissingState` as `all-complete | ready` avoids nullable fields and makes screen state explicit. `sharePageIds` typed as `readonly []` in all-complete branch.
- **Reuse scanner toast key**: `scanner.review.success` reused for missing-page collect toast. Single translation key for "sticker collected" confirmation across features.
- **No new provider/context**: missing state derived from existing `CollectionState` + `albumPages` data. Pure function adapter pattern consistent with stats implementation.
- **404 page share fix**: `NotFoundPage` was missing share integration. Added `buildInitialShareSelection` with `all-missing` type to make drawer fully functional from 404.
- **Consent banner hydration guard**: `hasMounted` state prevents SSR/client mismatch on consent read from localStorage. Existing pattern issue surfaced during testing.
- **Devtools production gating**: TanStack Devtools conditionally rendered only in DEV with explicit opt-in flags. Prevents unnecessary bundle in production and hydration issues.
- **ES locale terminology alignment**: "figuritas" → "cromos" across stats, scanner sections. Consistent with album domain terminology and existing en/pt-BR translations.

## Validation Performed

- **Unit tests**: `missing-state.test.ts` — all-complete, partial, empty collection, hidden stickers, sharePageIds derivation.
- **Browser tests**: `MissingScreen.browser.test.tsx` — header/back, share visibility, progress bar, sticker grid per type, collect flow with optimistic hide, toast, focus management, empty state, keyboard navigation.
- **Browser tests**: `missing.browser.test.tsx` — route rendering, share navigation params, back navigation, drawer entry from home/album.
- **Browser tests**: `MenuDrawer.browser.test.tsx` — "Missing Stickers" button visible, click navigation.
- **E2E**: `missing-page-journeys.test.ts` — full user path: Home → drawer → Missing → blocks visible → collect → toast → share → `/share` with `from=/missing`.
- **E2E**: `a11y-critical-flows.test.ts` — `/missing` axe violations clean, keyboard share flow, dark theme `/missing` axe violations clean.
- **Full QA**: `pnpm complete-check` passed — lint, format, type-check, unit tests, browser tests, E2E, coverage thresholds. No threshold changes required.

## Risks and Follow-ups

- **Optimistic UI edge case**: if collection state updates arrive out of order (unlikely with single-provider pattern), hidden sticker set may briefly show stale data. Reconciliation on base state change mitigates this.
- **Focus target DOM query**: `getNextFocusTarget` relies on `data-missing-sticker-id` attribute query. If sticker grid DOM changes significantly, focus management selectors need updating.
- **Share page ID derivation**: `sharePageIds` includes all pages with any missing sticker at the time of share tap. If user collects while navigating to share, share preview shows potentially stale selection. Acceptable UX trade-off.
- **ES locale terminology scope**: figuritas→cromos fix applied to stats and scanner sections. Verify no other sections use inconsistent terminology.
- **Devtools localStorage flag**: `sticker-tracker.devtools` flag persists across sessions. Users who set it may see devtools unexpectedly. Low risk — DEV only, no production impact.

---
title: STR-74 EP15 Stats Page and Home Entry CTA
type: development-log
permalink: docs/development-logs/task-str-74-ep15-stats-page-and-home-entry-cta
---

# Development Log: STR-74

## Metadata

- Task ID: STR-74
- Date (UTC): 2026-05-22T12:00:00Z
- Project: sticker-tracker
- Branch: feature/STR-74-stats-page-and-home-entry-cta
- Commit: staged (not yet committed)

## Objective

- Deliver a new mobile-first `/stat` screen (S9) with deterministic team/group rankings, neutral empty states, a Home hero magnify CTA entry from S0, and Mixpanel analytics tracking for both CTA click and stats page open events.

## Implementation Summary

### Sub-task STR-76 — Route shell and localized stats screen

- Created `src/routes/stat.tsx` — TanStack Start `createFileRoute('/stat')` route component. Thin wrapper: reads `AppStateContext`, returns `null` until `renderState === 'ready'`, builds stats view model via `buildStatsState()`, tracks `stats_page_opened` once per mount (ref guard), passes fixed `onBack` handler navigating to `/`. Uses `validateSearch` for optional `from` query param with source-path sanitization.
- Created `src/components/stats/StatsScreen.tsx` + `StatsScreen.module.css` — S9 mobile UI shell. Full-height layout, centered title, left arrow back button, token-based background/border/text colors, scrollable content sections. Renders intro card, team highlight cards, group highlight cards, completed/incomplete group summary cards, and neutral empty-state card for edge cases. Uses `useTranslation()` for all labels and locale-aware `Intl.NumberFormat` for counts. Semantic HTML with `aria-labelledby` section headings and `aria-label` back button.
- Added translation keys in all 3 locale files (`en`, `es`, `pt-BR`) under `stats.*` namespace: header, intro, sections, labels (moreStickers, lessStickers, group, completedGroups, incompleteGroups, allGroups, none), empty state.
- Auto-generated `src/routeTree.gen.ts` updated by TanStack — no manual edits.

### Sub-task STR-77 — Stats view-model logic and S9 card rendering

- Created `src/components/stats/stats-state.ts` — pure adapter layer consuming STR-73 shared selectors (`computeTeamStats`, `computeGroupStatsFromTeamStats`, `rankIncompleteTeamsByMostProgress`, `rankIncompleteTeamsByLeastProgress`, `rankIncompleteGroupsByMostProgress`, `rankIncompleteGroupsByLeastProgress`). Joins numeric output to album metadata (`albumPages`) for screen-ready card data without localized strings baked in.
- Explicit screen-state guards: `zero-progress` (all teams `collected === 0`), `all-complete` (all teams `isComplete`), `ready` (otherwise).
- `ready` state exposes: more/less sticker team highlights, more/less sticker group highlights, completed groups list, incomplete groups list (canonical `GROUP_LIST` order).
- Team cards display `collected/20`, group cards display `collected/80`. Empty states neutral — no celebratory or warning styling.

### Sub-task STR-78 — Home CTA entry and analytics wiring

- Extended `src/components/home/HomeHeroProgress.tsx` — added magnify CTA button inside hero ring center stack with `data-testid="home-stats-cta"` for locale-agnostic QA.
- Updated `HomeHeroProgress.module.css` — CTA placement and theme tokens matching S0 without disturbing ring SVG or aria labeling.
- In `HomeScreen.tsx`, added `handleOpenStats()` callback: fires `trackAnalyticsEvent('stats_cta_clicked', { source_path })` then navigates to `/stat`.
- In `src/routes/stat.tsx`, added one-time `useEffect` tracking for `trackAnalyticsEvent('stats_page_opened', { source_path })` with ref guard for dedup.
- Extended `src/services/analytics-service.ts` event-name union with `stats_cta_clicked` and `stats_page_opened`.

### Source-path sanitization extraction

- Created `src/lib/sanitize-from-path.ts` — shared sanitizer utility. Rejects non-string, non-leading-slash, double-slash, backslash-containing values; falls back to `/`.
- Route-level `sanitizeSourcePath()` in `stat.tsx` strips query/hash from raw `from` param before passing to sanitizer. Falls back to `/stat` if sanitized result is `/` but original was not `/`.
- Reused in `src/routes/share/index.tsx` and `src/routes/share/preview.tsx` for consistent analytics source-path handling.
- Updated `src/components/share/share-state.ts` to consume the shared sanitizer.

### Test infrastructure additions

- Created `test/helpers/typed-factories.ts` — `createCollectionState()` helper for building typed `CollectionState` in tests without manual casting.
- Created `test/helpers/async.ts` — `waitForCondition()` polling helper for browser tests.

## Files Changed

### New files (created)

- `src/routes/stat.tsx` — `/stat` route shell with analytics tracking and back navigation (STR-76, STR-78)
- `src/components/stats/StatsScreen.tsx` — S9 stats screen component with localized cards and empty states (STR-76, STR-77)
- `src/components/stats/StatsScreen.module.css` — token-based CSS module for stats screen (STR-76)
- `src/components/stats/stats-state.ts` — pure stats adapter consuming STR-73 selectors (STR-77)
- `src/lib/sanitize-from-path.ts` — shared source-path sanitizer (STR-78)
- `test/components/stats/stats-state.test.ts` — unit tests for stats adapter (STR-77)
- `test/components/stats/StatsScreen.browser.test.tsx` — browser tests for stats screen rendering (STR-77)
- `test/routes/stat.test.tsx` — unit tests for route definition (STR-78)
- `test/routes/stat.browser.test.tsx` — browser tests for route analytics and back navigation (STR-78)
- `test/services/analytics-service.test.ts` — unit tests for analytics service init/track/edge cases (STR-78)
- `test/helpers/typed-factories.ts` — typed collection state factory (STR-77)
- `test/helpers/async.ts` — async polling helper for browser tests (STR-77)

### Modified files

- `src/components/home/HomeHeroProgress.tsx` — magnify CTA button with `data-testid` (STR-78)
- `src/components/home/HomeHeroProgress.module.css` — CTA styling tokens (STR-78)
- `src/components/home/HomeScreen.tsx` — `handleOpenStats()` with analytics + navigation (STR-78)
- `src/services/analytics-service.ts` — event-name union extended with `stats_cta_clicked`, `stats_page_opened` (STR-78)
- `src/routes/share/index.tsx` — consumes shared sanitizer (STR-78)
- `src/routes/share/preview.tsx` — consumes shared sanitizer (STR-78)
- `src/components/share/share-state.ts` — uses shared sanitizer (STR-78)
- `src/locales/en/translation.json` — `stats.*` namespace keys + `home.hero.openStats` (STR-76)
- `src/locales/es/translation.json` — `stats.*` namespace keys + `home.hero.openStats` (STR-76)
- `src/locales/pt-BR/translation.json` — `stats.*` namespace keys + `home.hero.openStats` (STR-76)
- `AGENTS.md` — analytics events table updated with `stats_cta_clicked` and `stats_page_opened` (STR-78)
- `src/routeTree.gen.ts` — auto-regenerated by TanStack (STR-76)
- `test/components/home/HomeHeroProgress.browser.test.tsx` — CTA render/accessibility tests (STR-78)
- `test/components/home/HomeScreen.browser.test.tsx` — CTA navigation + click analytics tests (STR-78)
- `test/components/share/share-state.test.ts` — sanitizer integration tests (STR-78)
- `e2e/home-progress-journeys.test.ts` — Home → `/stat` → Home E2E journey (STR-78)
- `e2e/a11y-critical-flows.test.ts` — `/stat` accessibility + dark theme checks (STR-78)

## Key Decisions

- **Pure adapter pattern (`stats-state.ts`)**: keeps ranking logic testable and decoupled from UI. No new ranking logic — reuses STR-73 shared selectors exclusively. Prevents drift between Home and Stats rankings.
- **No new provider/store/context**: album is fixed-size; pure selectors + route adapter pattern sufficient. Consistent with existing codebase architecture.
- **Neutral empty states**: both `zero-progress` and `all-complete` render identical neutral placeholder card. No celebratory/warning styling — avoids implying success when no data exists.
- **Token-only styling**: all colors, spacing, typography from CSS variable tokens. No hardcoded values in CSS module.
- **Feature-local screen shell**: no abstracted generic centered-header component. Only share and stats need the pattern; premature abstraction rejected.
- **Shared sanitizer extraction**: `sanitize-from-path.ts` extracted when share routes needed identical logic. Single utility avoids drift between route analytics sanitization.
- **`data-testid="home-stats-cta"`**: deterministic test hook decouples E2E from translated CTA text, resilient across locales.
- **Ref-guarded analytics**: `hasTrackedOpenRef` prevents duplicate `stats_page_opened` events on React re-renders, matching share-preview route pattern.

## Validation Performed

- **Unit tests**: `stats-state.test.ts` — zero-progress, all-complete, completed-team exclusion, deterministic tie-breaking, canonical group ordering.
- **Unit tests**: `analytics-service.test.ts` — no-window guard, consent-not-granted guard, single init + reuse, concurrent init coalescing, track-on-init, skip-on-fail.
- **Unit tests**: `stat.test.tsx` — route definition validation.
- **Unit tests**: `share-state.test.ts` — sanitizer integration coverage.
- **Browser tests**: `StatsScreen.browser.test.tsx` — header/back rendering, partial-data card rendering, zero-progress empty state, all-complete empty state, translated copy availability.
- **Browser tests**: `stat.browser.test.tsx` — one-time page-open analytics, back navigation.
- **Browser tests**: `HomeHeroProgress.browser.test.tsx` — CTA render and accessibility.
- **Browser tests**: `HomeScreen.browser.test.tsx` — CTA navigation + click analytics.
- **E2E**: `home-progress-journeys.test.ts` — full user path: Home loads → magnify CTA visible → tap CTA → `/stat` renders → back arrow returns to `/`.
- **E2E**: `a11y-critical-flows.test.ts` — `/stat` accessibility check + dark-theme `/stat` check.
- **Full QA**: `pnpm complete-check` passed green — lint, format, type-check, unit tests, browser tests, E2E, coverage thresholds. No threshold changes required.

## Risks and Follow-ups

- **Source-path sanitization edge cases**: current sanitizer is conservative (rejects anything unusual). If analytics needs richer path attribution, sanitizer may need expansion with URL parsing.
- **Empty-state design evolution**: neutral empty state works for both edges but may need differentiation if product requirements change (e.g., celebratory all-complete state).
- **Ranking stability dependency**: stats adapter relies on `GROUP_LIST` and album canonical order for tie-breaking. Dynamic group ordering would require secondary tie-break key.
- **Analytics event stability**: `stats_cta_clicked` and `stats_page_opened` are now documented in AGENTS.md and tracked in Mixpanel. Renaming requires coordinated docs + code update.

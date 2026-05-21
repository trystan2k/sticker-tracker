---
title: STR-72 Home Country Tile Progress Bars
type: development-log
permalink: docs/development-logs/task-str-72-home-country-tile-progress-bars
---

# Development Log: STR-72

## Metadata

- Task ID: STR-72
- Date (UTC): 2026-05-21T16:13:29Z
- Project: sticker-tracker
- Branch: feature/STR-72-home-country-tile-progress-bars
- Commit: merged (squashed into release)

## Objective

- Add team/group progress bars and sticker counts to Home country tiles, backed by shared pure selectors and ranking helpers.

## Implementation Summary

### Sub-task STR-73 — Shared team/group stats selectors

- Created `src/data/album-stats.ts` — pure module with team-only selectors, group selectors, and ranking helpers.
- Team selectors exclude special pages (e.g., shinies, stadiums) from team totals and rankings.
- Ranking helpers exclude completed teams/groups and tie-break by canonical album / `GROUP_LIST` order for deterministic placement.
- Team/group counts clamped inside shared selectors; special-page adapter clamp reverted to preserve prior behavior.

### Sub-task STR-75 — Home country tile progress UI

- Rewired Home adapter in `src/components/home/home-state.ts` to consume shared selectors.
- `HomeGroupCards` now renders `X/20` sticker counts and token-based progress bars per team tile.
- Added deterministic `data-team-*` hooks for resilient browser/E2E tests.
- Refactored to avoid duplicate group-stat recomputation from collection — selectors compute once, components consume.

## Files Changed

- `src/data/album-stats.ts` — new shared pure module for team/group stats, selectors, ranking helpers (STR-73)
- `src/components/home/home-state.ts` — Home adapter rewired to use shared selectors (STR-75)
- `src/components/home/HomeGroupCards.tsx` — team tiles with sticker count + progress bars, `data-team-*` hooks (STR-75)
- `src/components/home/HomeGroupCards.module.css` — token-based progress bar styles (STR-75)
- Related test files — vitest unit suites for album-stats and home-state
- Related E2E files — Playwright `home-progress` specs updated with deterministic selectors

## Key Decisions

- **Pure selector module (`album-stats.ts`)**: keeps stat logic testable and reusable outside Home. Single source of truth for team/group counts and rankings.
- **Special-page exclusion**: special pages excluded from team/group totals and rankings to avoid skewing progress metrics.
- **Deterministic tie-breaking**: canonical album order and `GROUP_LIST` order used as tie-breakers so rankings are stable across sessions and test runs.
- **Clamp placement**: team/group counts clamped in shared selectors; special-page adapter clamp reverted because it duplicated protection and hid edge cases from selector tests.
- **`data-team-*` hooks**: deterministic test attributes decouple E2E from CSS/text structure changes, reducing brittleness.

## Validation Performed

- Focused vitest suites passed during implementation (album-stats, home-state, selector units).
- Playwright `home-progress` E2E fixed for WebKit visibility regression — hidden tile detection required explicit wait strategy.
- Final `pnpm complete-check` passed fully — lint, format, unit tests, E2E, coverage thresholds.
- QA review: caught WebKit E2E hidden tile issue in initial pass; fixed before final review.
- Code review: requested and applied fixes for duplicate compute, overflow guards, clamping consistency, brittle test selectors.
- Architecture review: passed with no actionable findings.
- Final QA/code/architecture reviews all passed.

## Risks and Follow-ups

- **Special-page clamp divergence**: shared selectors clamp, adapter does not. Future refactor should unify clamping strategy if special-page adapter regains independent clamping.
- **Ranking stability**: relies on `GROUP_LIST` order. If group order becomes dynamic, tie-breaking may need a secondary key.
- **Progress bar token dependency**: token-based styling assumes design tokens remain stable. Token renames will require CSS module updates.

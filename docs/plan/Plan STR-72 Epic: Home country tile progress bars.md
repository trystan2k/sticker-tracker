## Task Analysis

- Main objective: Deliver STR-72 by extracting team/group progress into a shared pure selector layer for Home and future `/stat` reuse, then wire that shared data into Home country tiles so every team tile shows `X/20` plus a progress bar without changing existing navigation, hero math, or special-page behavior.
- Identified dependencies:
  - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/home-state.ts` currently owns Home summary, group-card derivation, and special-page derivation; it should become a thin Home adapter instead of the long-term stats source.
  - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/data/album.ts` is canonical for `page.type`, `GROUP_LIST`, sticker totals, and exact album order; tie-break logic must come from this file instead of ad-hoc sorting.
  - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.tsx` and `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.module.css` already own the Home tile markup, overlay layout, and tap-target structure that STR-75 must preserve.
  - Existing tests to extend: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/home-state.test.ts`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeGroupCards.browser.test.tsx`, `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`, and `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/data/album.test.ts` patterns.
  - Visual source of truth remains `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/design/sticker-tracker.pen` S0 Home plus generated token CSS in `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/design-tokens/dist/*.css`.
  - Plan file: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-72 Epic: Home country tile progress bars.md`.
- System impact:
  - Data layer: add shared ranking-ready selectors scoped to `page.type === 'team'` only.
  - Home mapping layer: `home-state.ts` stops duplicating team/group math and instead combines shared stats with album metadata, translation keys, and route helpers.
  - UI layer: Home team tiles gain per-team counts and progress bars; group headers, group-level bars, hero ring, special cards, and existing navigation contracts stay structurally intact.
  - QA layer: add pure selector coverage for ordering/ranking edge cases and browser coverage for tile rendering, overflow-safe content density, and preserved navigation.

## Chosen Approach

- Proposed solution:
  - Create a new shared domain module at `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/data/album-stats.ts` with ordered `computeTeamStats`, ordered `computeGroupStats`, and narrow ranking helpers for most/least-progress incomplete teams/groups.
  - Keep `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/home-state.ts` as the Home-only projection layer: preserve `computeHomeSummary` and `computeSpecialPagesData`, and rebuild `computeGroupsData` from shared stats + `albumPages` + `getAlbumPath()`.
  - Implement STR-75 only inside the existing Home tile surface: extend each team tile payload with collected/total/percentage, render `X/20` and a decorative progress bar inside the same tile button, and tighten typography with token-backed CSS so long localized team names do not overflow.
- Justification for simplicity:
  - Reject keeping shared stats inside `home-state.ts`; that would preserve current mixing of reusable data logic with Home-specific labels and paths, making later `/stat` reuse awkward.
  - Reject a provider/store/selectors framework; album size is fixed and tiny, so plain pure functions are simpler, easier to test, and enough for current and near-future scope.
  - Reject changing `album.ts` shapes or Home routing/button structure; current dataset already provides canonical order and current buttons already satisfy tap-target/navigation behavior.
- Components to be modified/created:
  - STR-73 — Shared team/group stats selectors
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/data/album-stats.ts`
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/data/album-stats.test.ts`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/home-state.ts`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/home-state.test.ts`
    - No locale, route, or provider changes expected.
  - STR-75 — Home country tile progress UI
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.module.css`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeGroupCards.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`
    - Conditional low-risk touch only if integration wiring changes: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`

## Implementation Steps

1. Implement STR-73 shared selector contract first in `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/data/album-stats.ts` and lock its tests before touching Home UI.
   - Build ordered team stats from `albumPages.filter((page) => page.type === 'team')`, returning only team-scoped identifiers plus numeric progress fields (`pageId`, `group`, `collected`, `total`, `percentage`, `isComplete`).
   - Build ordered group stats from the team stats in `GROUP_LIST` order, returning `group`, `collected`, `total`, `percentage`, and `isComplete`.
   - Add ranking helpers for most/least-progress teams and groups that exclude completed items from both ends and resolve ties by canonical order from `albumPages` / `GROUP_LIST`.
   - Cover edge cases in `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/data/album-stats.test.ts`: empty collection, partial collection, unknown page ids, special-page entries present in collection, deterministic ties, and all-complete/no-eligible cases.
   - Correctness checkpoint: selector tests prove `mex` and group `A` counts are correct, special pages never affect totals/rankings, and tie winners follow album order.
   - Rollback / mitigation: if the API starts drifting toward UI metadata, strip it back to identifiers + numeric stats only and keep metadata joining in consumer layers.
2. Rewire the Home adapter layer to shared selectors without changing hero summary or special-card behavior.
   - Update `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/home-state.ts` so `computeGroupsData()` consumes shared team/group stats, merges them with `albumPages` metadata and `getAlbumPath()`, and extends each team tile payload with `collected`, `total`, `percentage`, and `isComplete`.
   - Preserve `computeHomeSummary()` exactly so Home hero continues to use full album progress, including special pages.
   - Preserve `computeSpecialPagesData()` exactly so special-card behavior stays out of STR-72 scope.
   - Refocus `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/home-state.test.ts` on adapter behavior: unchanged group order, unchanged first-page paths, correct team payload mapping, plus regression coverage for summary and special cards.
   - Correctness checkpoint: Home adapter still returns 12 groups in `GROUP_LIST` order, existing navigation paths stay stable, and team entries now expose ready-to-render stats.
3. Implement STR-75 inside the existing Home tile buttons so counts/progress render without breaking tap targets.
   - Update `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.tsx` to render code, translated team name, `collected/total`, and a decorative progress track/fill inside each `teamTile` button.
   - Keep group-card and team-tile navigation structure unchanged: no nested links, no nested buttons, no separate progress CTA.
   - Add or tighten accessible naming on the tile button so screen readers still get the translated team name plus count, while the visual progress bar remains `aria-hidden`.
   - Update `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeGroupCards.module.css` with token-backed spacing, font-size, and overflow guards (`min-width: 0`, tighter stack spacing, line clamp/ellipsis as needed) so long names fit S0 without per-team exceptions and both themes continue inheriting semantic colors automatically.
   - Correctness checkpoint: team tiles show `0/20`, partial, and `20/20` states correctly; tile click still navigates; group-card click still works outside the tile grid.
   - Rollback / mitigation: if dense tile content causes layering or hit-target regressions, keep the outer button and only refactor internal tile layout; do not replace the current interaction model.
4. Add focused regression coverage, then run visual/manual verification and full QA.
   - Extend `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeGroupCards.browser.test.tsx` for per-team count rendering, inline progress width, preserved navigation, and completed-tile visuals.
   - Extend `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx` with a seeded collection so full-screen integration proves shared selector data reaches Home tiles through the current screen wiring.
   - Manually compare Home light and dark screens against Pencil S0 with longest translated team names and zero/partial/complete states before sign-off.
   - Run `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker` QA command: `pnpm complete-check`.
   - Correctness checkpoint: tests stay green, Home hero/special cards/drawer still behave, and visual review confirms S0 alignment in both themes.

## Validation

- Success criteria:
  - Plan file exists at `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-72 Epic: Home country tile progress bars.md`.
  - STR-73 is complete when shared selectors expose ordered per-team collected/total/percentage and ordered per-group collected/total/percentage/completion, ignore all non-team pages, keep localized strings out of selector output, and provide ranking helpers that exclude completed teams/groups while resolving ties by canonical album order.
  - STR-75 is complete when every Home team tile shows `X/20` plus a progress bar, typography stays within the tile in S0, light/dark themes remain token-aligned with Pencil, and existing group/tile navigation still works.
  - `pnpm complete-check` passes after the selector and Home UI updates.
- Checkpoints:
  - Pre-implementation assumptions check:
    - Reconfirm only `page.type === 'team'` participates in team/group totals and rankings.
    - Reconfirm `/stat` UI stays out of scope and selector helpers remain numeric/ranking-ready only.
    - Reconfirm Home hero summary remains full-album progress and is not re-scoped to team-only totals.
  - During-implementation correctness checks:
    - After Step 1, selector tests prove special pages and unknown page ids are ignored, completed items are removed from ranking ends, and ties resolve by album/group order.
    - After Step 2, `computeGroupsData()` still returns stable group order and paths while exposing per-team stats for rendering.
    - After Step 3, browser tests prove per-team counts and progress bars render correctly and tile/group navigation remains intact.
  - Post-implementation verification and regression checks:
    - Manual S0 comparison in both themes for zero, partial, and complete tile states.
    - Manual overflow spot-check in EN, ES, and PT-BR using the longest team names.
    - `pnpm complete-check` stays green with no regressions in Home hero, special cards, drawer interactions, or existing tile navigation.

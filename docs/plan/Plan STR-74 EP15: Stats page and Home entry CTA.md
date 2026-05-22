## Task Analysis

- Main objective:
  - Deliver STR-74 end-to-end by adding a new mobile-first `/stat` screen that matches S9 in structure/theme, reuses STR-73 shared stats selectors for deterministic rankings, exposes a Home hero magnify CTA entry from S0, and tracks both CTA click and stats page open through `src/services/analytics-service.ts`.
- Identified dependencies:
  - `src/data/album-stats.ts` already owns team/group progress, completion filtering, and deterministic tie ordering; `/stat` should consume it instead of re-implementing ranking logic.
  - `src/components/home/HomeHeroProgress.tsx`, `src/components/home/HomeHeroProgress.module.css`, and `src/components/home/HomeScreen.tsx` own the S0 hero ring where the magnify CTA belongs.
  - `src/routes/share/index.tsx`, `src/routes/share/preview.tsx`, `src/components/share/ShareSelectionScreen.tsx`, and `src/components/share/SharePreviewScreen.tsx` show the existing pattern for dedicated mobile screens with centered titles, left back arrow, route-level search handling, and route-level analytics side effects.
  - `src/i18n/config.ts` plus `src/locales/en/translation.json`, `src/locales/es/translation.json`, and `src/locales/pt-BR/translation.json` are the existing localization contract; new strings should stay grouped under a dedicated `stats` namespace plus one Home hero CTA label.
  - `src/services/analytics-service.ts` currently whitelists only existing events, and `AGENTS.md` is the required analytics event documentation source.
  - Visual source of truth: `docs/design/sticker-tracker.pen` S9 Statistics Light/Dark for `/stat` and S0 Home Light/Dark for CTA placement.
  - Auto-generated route registry: `src/routeTree.gen.ts` will regenerate after creating `src/routes/stat.tsx`; do not hand-edit it.
  - Plan file: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-74 EP15: Stats page and Home entry CTA.md`.
- System impact:
  - Routing: add a new top-level `/stat` route.
  - UI: add a new stats screen module with token-driven light/dark styling and localized copy.
  - Derived state: add a stats-specific adapter that maps existing numeric selectors into screen-ready team/group highlight cards and deterministic empty-state decisions.
  - Home: extend the hero ring with a small magnify CTA that navigates to `/stat`.
  - Analytics: add two new tracked events, wire them through the analytics service only, and document them in `AGENTS.md`.
  - QA: add selector/unit coverage, browser coverage, route coverage, and targeted E2E/a11y regression coverage for the new flow.

## Chosen Approach

- Proposed solution:
  - Create a dedicated `src/components/stats` feature module with:
    - `StatsScreen.tsx` + `StatsScreen.module.css` for the S9 mobile UI shell and cards.
    - `stats-state.ts` as a pure adapter that consumes `computeTeamStats`, `computeGroupStatsFromTeamStats`, and existing ranking helpers from `src/data/album-stats.ts`, then returns card-ready view data without localized strings baked in.
  - Add `src/routes/stat.tsx` as a thin route wrapper that:
    - reads `AppStateContext`,
    - returns `null` until app state is ready, matching other route patterns,
    - builds the stats view model,
    - tracks `stats_page_opened` once per mount,
    - passes a fixed `onBack` handler that navigates to `/`.
  - Extend the existing Home hero ring instead of adding a new Home section:
    - add the S0 magnify CTA inside `HomeHeroProgress`,
    - wire navigation and `stats_cta_clicked` tracking in `HomeScreen`.
  - Keep analytics minimal and explicit:
    - CTA event on click from Home,
    - page-open event on `/stat` mount,
    - both routed through `trackAnalyticsEvent()` only.
- Justification for simplicity:
  - Reject adding new shared ranking logic in `/stat`; `src/data/album-stats.ts` already solves completion filtering and deterministic ties, so duplicating it would create drift.
  - Reject a new provider/store/context for stats; the album is fixed-size and current feature patterns use pure selectors plus route/component adapters effectively.
  - Reject abstracting a generic centered-header component right now; only share and stats need the pattern, and existing codebase favors feature-local screen shells over premature shared UI primitives.
  - Reject preserving S9 placeholder card numbers literally where they conflict with domain truth; acceptance criteria require real team rankings, so team cards must use team totals (`/20`) while group cards use group totals (`/80`).
- Components to be modified/created:
  - Create `src/routes/stat.tsx`
  - Create `src/components/stats/StatsScreen.tsx`
  - Create `src/components/stats/StatsScreen.module.css`
  - Create `src/components/stats/stats-state.ts`
  - Create `test/components/stats/stats-state.test.ts`
  - Create `test/components/stats/StatsScreen.browser.test.tsx`
  - Create `test/routes/stat.test.tsx`
  - Create `test/routes/stat.browser.test.tsx`
  - Modify `src/components/home/HomeHeroProgress.tsx`
  - Modify `src/components/home/HomeHeroProgress.module.css`
  - Modify `src/components/home/HomeScreen.tsx`
  - Modify `src/services/analytics-service.ts`
  - Modify `src/locales/en/translation.json`
  - Modify `src/locales/es/translation.json`
  - Modify `src/locales/pt-BR/translation.json`
  - Modify `AGENTS.md`
  - Extend `test/components/home/HomeHeroProgress.browser.test.tsx`
  - Extend `test/components/home/HomeScreen.browser.test.tsx`
  - Extend `e2e/home-progress-journeys.test.ts`
  - Extend `e2e/a11y-critical-flows.test.ts`
  - Regenerated output expected: `src/routeTree.gen.ts`

## Implementation Steps

1. Implement STR-76 route shell first by adding the new `/stat` route and the localized screen skeleton.
   - Create `src/routes/stat.tsx` with `createFileRoute('/stat')` and a thin route component that follows existing share/scanner guard patterns: read `AppStateContext`, return `null` until `renderState === 'ready'`, and pass a fixed back handler to `/`.
   - Create `src/components/stats/StatsScreen.tsx` + `StatsScreen.module.css` with the S9 shell only first: full-height mobile layout, centered title, left arrow, matching safe-area/footer spacing, token-based background/border/text colors, and scrollable content sections.
   - Add initial translation keys in all 3 locale files for header/back/title, section titles, empty-state copy, and ranking labels under a new `stats` namespace, plus a `home.hero.openStats` CTA label.
   - Let TanStack regenerate `src/routeTree.gen.ts`; do not hand-edit it.
   - Correctness checkpoint: `/stat` renders a themed shell in EN/ES/PT-BR, back arrow always navigates to `/`, and no route code depends on ad-hoc window parsing.
   - Rollback / mitigation: if route scaffolding starts pulling data/analytics/UI concerns together, keep `src/routes/stat.tsx` thin and move logic into `stats-state.ts` or `StatsScreen.tsx` before continuing.

2. Implement STR-77 view-model logic in a new pure adapter before building the final cards.
   - Create `src/components/stats/stats-state.ts` as the stats-only projection layer that reuses `computeTeamStats`, `computeGroupStatsFromTeamStats`, `rankIncompleteTeamsByMostProgress`, `rankIncompleteTeamsByLeastProgress`, `rankIncompleteGroupsByMostProgress`, and `rankIncompleteGroupsByLeastProgress` from `src/data/album-stats.ts`.
   - Join numeric selector output back to album metadata from `src/data/album.ts` so the screen can render album code, team translation key, group letter, collected totals, total counts, missing counts, and deterministic group lists without leaking UI strings into the selector module.
   - Add explicit screen-state guards:
     - `zero_progress` when every team has `collected === 0`,
     - `all_complete` when every team is complete,
     - `ready` otherwise.
   - For `ready` state, expose:
     - one “more stickers” team highlight,
     - one “less stickers” team highlight,
     - one “more stickers” group highlight,
     - one “less stickers” group highlight,
     - completed group summary card data,
     - incomplete group summary card data.
   - Preserve acceptance semantics by using ranking helpers only for more/less spotlight cards; completed-group cards come from ordered `groupStats` lists and are not part of the “exclude completed from rankings” rule.
   - Add `test/components/stats/stats-state.test.ts` for deterministic tie behavior, completed-item exclusion, zero-progress short-circuit, all-complete short-circuit, and canonical `GROUP_LIST` ordering for summary lists.
   - Correctness checkpoint: no new sorting logic duplicates `album-stats.ts`; spotlight picks are deterministic because they come directly from existing ranking helpers.
   - Rollback / mitigation: if adapter output starts mixing translated copy with data, strip it back to identifiers/keys/numbers and keep formatting inside the screen component.

3. Finish STR-77 UI by rendering the final S9 cards and neutral empty states with real album semantics.
   - Flesh out `StatsScreen.tsx` to render:
     - S9 header shell,
     - hero intro block,
     - team highlight cards,
     - group highlight cards,
     - completed/incomplete group summary cards,
     - a single neutral empty-state card for `zero_progress` and `all_complete` instead of arbitrary ranking winners.
   - Match S9 structure and tone, but use real domain totals:
     - team cards display `collected/20`,
     - group cards display `collected/80`,
     - labels use “more stickers” / “less stickers” wording instead of “more missing”.
   - Reuse current project patterns for formatting:
     - `useTranslation()` inside the screen,
     - locale-aware number formatting where needed,
     - token CSS variables only,
     - no new design token definitions.
   - Keep the empty state neutral in both edge cases: no success-only celebratory styling for all-complete, no warning-only styling for zero-progress.
   - Add `StatsScreen.browser.test.tsx` for header/back rendering, partial-data card rendering, neutral zero-progress empty state, neutral all-complete empty state, and translated copy availability.
   - Correctness checkpoint: spotlight cards never show completed teams/groups, section ordering matches S9, and empty states suppress fake tie winners when every incomplete item is at zero.
   - Rollback / mitigation: if S9 sample copy/placeholder values conflict with acceptance, prioritize acceptance/domain truth and keep only the structural/card styling from Pencil.

4. Implement STR-78 Home entry wiring and analytics after `/stat` itself is stable.
   - Extend `HomeHeroProgress.tsx` to render the small magnify CTA inside the hero ring center stack, using a dedicated accessible button and a stable test hook such as `data-testid="home-stats-cta"` for locale-agnostic QA.
   - Update `HomeHeroProgress.module.css` so the CTA matches S0 placement and theme tokens without disturbing the current ring SVG or aria labeling.
   - In `HomeScreen.tsx`, add a `handleOpenStats()` callback that fires `trackAnalyticsEvent('stats_cta_clicked', ...)` and then navigates to `/stat`.
   - In `src/routes/stat.tsx`, add a one-time `useEffect` tracking call for `trackAnalyticsEvent('stats_page_opened', ...)`, following the existing share-preview route pattern with a ref guard to avoid duplicate events.
   - Extend `src/services/analytics-service.ts` event-name union for both new events.
   - Update `AGENTS.md` tracked-events table with both new events, their triggers, properties, and file ownership.
   - Add/extend tests:
     - `HomeHeroProgress.browser.test.tsx` for CTA render/accessibility,
     - `HomeScreen.browser.test.tsx` for CTA navigation + click analytics,
     - `test/routes/stat.test.tsx` for route definition,
     - `test/routes/stat.browser.test.tsx` for one-time page-open analytics and back navigation.
   - Correctness checkpoint: analytics still flow only through `trackAnalyticsEvent()`, feature components never import `mixpanel-browser`, and docs stay aligned with runtime event names.

5. Run targeted regression coverage, then full QA.
   - Extend `e2e/home-progress-journeys.test.ts` with the user path: Home loads → magnify CTA visible → tap CTA → `/stat` renders → back arrow returns to `/`.
   - Extend `e2e/a11y-critical-flows.test.ts` with a `/stat` accessibility check and a dark-theme `/stat` check, reusing existing light/dark and route-ready helpers where possible.
   - Manually compare `/stat` light and dark against S9 for header spacing, card stack spacing, positive/warning accents, and safe-area treatment.
   - Manually verify EN/ES/PT-BR longest strings for header title, empty-state copy, and team/group subtitles.
   - Run repository QA command: `pnpm complete-check`.
   - Correctness checkpoint: all unit/browser/E2E/a11y checks pass, `/stat` matches S9 structure in both themes, Home CTA works, and analytics docs/runtime stay consistent.

## Validation

- Success criteria:
  - Plan file exists at `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-74 EP15: Stats page and Home entry CTA.md`.
  - `/stat` exists as a mobile-first localized route with S9-style centered header, left back arrow, and token-based light/dark styling.
  - Team and group spotlight cards reuse deterministic ranking helpers, exclude completed items from rankings, and resolve ties by canonical album/group order.
  - Zero-progress and all-complete collections show neutral empty states instead of arbitrary ranking winners.
  - Home magnify CTA opens `/stat`, tracks click analytics, `/stat` tracks page-open analytics, and `AGENTS.md` reflects both events.
  - `pnpm complete-check` passes without changing coverage thresholds.
- Checkpoints:
  - Pre-implementation assumptions check:
    - Reconfirm `/stat` should use existing STR-73 shared selectors as the only ranking source.
    - Reconfirm “less stickers” copy replaces any “more missing” wording in the implementation.
    - Reconfirm zero-progress and all-complete both short-circuit to neutral empty states at screen level.
    - Reconfirm S9 placeholder team counts are illustrative only; domain-correct team totals are `20`.
  - During-implementation correctness checks:
    - After Step 1, `/stat` shell renders in all locales/themes and route generation succeeds without manual `routeTree.gen.ts` edits.
    - After Step 2, stats-state tests prove deterministic ranking, completed-item exclusion, and correct empty-state branching.
    - After Step 3, browser tests prove partial stats render correctly and both empty states suppress spotlight cards.
    - After Step 4, browser/route tests prove CTA click analytics and page-open analytics fire exactly once through `analytics-service.ts`.
  - Post-implementation verification and regression checks:
    - Manual S9 review in light/dark with real collection states: zero progress, partial progress, all complete.
    - Manual i18n spot-check in EN/ES/PT-BR for header, spotlight labels, and empty-state copy.
    - `pnpm complete-check` green, including updated E2E/a11y flows for Home → `/stat` → Home.

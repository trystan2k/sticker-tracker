## Task Analysis

- Main objective:
  - Build `/missing` as a live missing-stickers route that derives its UI from the existing collection state only.
  - Show missing stickers grouped by page in canonical album order, omit completed pages, support optimistic collect/remove, toast feedback, share handoff, dedicated all-collected empty state, i18n, dark/light tokens, and accessibility.
  - Plan file: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-79 EP17: Missing Stickers Page.md`
- Identified dependencies:
  - `src/data/album.ts` is canonical for page order, page metadata, sticker ids, and album totals.
  - `src/providers/AppStateProvider.tsx` and `src/services/collection-service.ts` already own collection persistence plus the existing `stickers_marked_collected` analytics path through `toggleCollected()`.
  - `src/components/share/share-state.ts` plus `src/routes/share/index.tsx` and `src/routes/share/preview.tsx` already implement the `pages` + `from` share contract and should be reused unchanged if possible.
  - `src/components/MenuDrawer.tsx`, `src/components/home/HomeScreen.tsx`, `src/components/album-viewer/AlbumPageHeader.tsx`, and `src/components/not-found/NotFoundPage.tsx` are the current drawer hosts that need the new `/missing` entry.
  - `src/components/album-viewer/StickerCell.tsx` and `src/components/album-viewer/StickerGrid.module.css` already define the missing-sticker visual language and spacing patterns worth reusing.
  - Existing pure derivation pattern already exists in `src/components/home/home-state.ts`, `src/components/stats/stats-state.ts`, and `src/components/share/share-state.ts`; missing-page state should follow that pattern.
  - Pencil audit of `docs/design/sticker-tracker.pen` shows `S10 All Missing – Light`, `S10 All Missing – Dark`, reusable `component/Toast/Success`, and the same album/header surface palette already used by stats/share screens. Existing motion convention is fast (`~180ms`) in `MenuDrawer` and `PwaUpdateToast`.
- System impact:
  - New route/controller: `src/routes/missing.tsx`.
  - New feature slice: `src/components/missing/` for derived state and screen UI.
  - Cross-cutting updates: drawer navigation, translations, generated route tree, browser tests, E2E flows, a11y coverage.
  - Likely inspect/change paths: `src/routes/missing.tsx`, `src/components/missing/missing-state.ts`, `src/components/missing/MissingScreen.tsx`, `src/components/missing/MissingScreen.module.css`, `src/components/MenuDrawer.tsx`, `src/components/MenuDrawer.module.css`, `src/components/home/HomeScreen.tsx`, `src/components/album-viewer/AlbumPageHeader.tsx`, `src/components/not-found/NotFoundPage.tsx`, `src/locales/en/translation.json`, `src/locales/pt-BR/translation.json`, `src/locales/es/translation.json`, `src/routeTree.gen.ts` (generated only), related tests under `test/components/` and `e2e/`.
  - Remaining ambiguities: none.

## Chosen Approach

- Proposed solution:
  - Create a pure helper module `src/components/missing/missing-state.ts` as the single source of truth for missing-page derivation.
    - Derive ordered page blocks from `albumPages`.
    - Filter out fully collected pages.
    - Expose page-level missing counts, total missing count, collected/album totals for the header progress section, all-collected empty-state model, and current shareable page ids.
    - Allow a lightweight optimistic-hidden sticker overlay so the same helper can drive both persisted and immediately-removed UI states.
  - Add a thin TanStack file route at `src/routes/missing.tsx` that gates on `AppStateContext`, passes live collection + callbacks into `MissingScreen`, and keeps navigation logic small (`back -> '/'`, `share -> '/share'` with `from: '/missing'`).
  - Let `MissingScreen` own only local UI state: optimistic pending/removing stickers, transient success toast, and focus handoff after removal. Keep persistence and analytics delegated to the existing `appState.toggleCollected()` path.
  - Reuse current app patterns instead of creating new infrastructure:
    - reuse `buildInitialShareSelection()` / `encodeShareSelection()` for share preselection.
    - reuse `scanner.review.success` for collected-success toast copy.
    - reuse existing token-backed full-screen layout patterns from stats/share screens.
    - reuse `StickerCell` visual contract where it reduces drift from album pages and Pencil S10.
- Justification for simplicity:
  - Reject a new provider/store for missing-page state. Collection already exists as the only durable source of truth.
  - Reject snapshot restore or URL-serialized missing stickers. User-approved behavior is recompute-only when returning from share.
  - Reject a new toast, animation, or analytics dependency. Local screen state + current provider analytics path is enough.
  - Reject cross-feature coupling to home/share/stats internals when a small dedicated helper keeps the feature cleaner.
  - Reject changing `AppStateProvider`, storage schema, or analytics event definitions unless a hard blocker appears.
- Components to be modified/created:
  - Create:
    - `src/routes/missing.tsx`
    - `src/components/missing/missing-state.ts`
    - `src/components/missing/MissingScreen.tsx`
    - `src/components/missing/MissingScreen.module.css`
    - `test/components/missing/missing-state.test.ts`
    - `test/components/missing/MissingScreen.browser.test.tsx`
    - `e2e/missing-page-journeys.test.ts`
  - Modify:
    - `src/components/MenuDrawer.tsx`
    - `src/components/MenuDrawer.module.css`
    - `src/components/home/HomeScreen.tsx`
    - `src/components/album-viewer/AlbumPageHeader.tsx`
    - `src/components/not-found/NotFoundPage.tsx`
    - `src/locales/en/translation.json`
    - `src/locales/pt-BR/translation.json`
    - `src/locales/es/translation.json`
    - `src/routeTree.gen.ts` (generated only)
    - `test/components/MenuDrawer.browser.test.tsx`
    - `test/components/home/HomeScreen.browser.test.tsx`
    - `test/components/album-viewer/AlbumPageHeader.browser.test.tsx`
    - `test/components/not-found/NotFoundPage.browser.test.tsx`
    - `test/i18n/translation-resources.test.ts`
    - `e2e/home-menu-drawer.test.ts`
    - `e2e/a11y-critical-flows.test.ts`
  - Inspect-but-likely-unchanged:
    - `src/components/share/share-state.ts`
    - `src/routes/share/index.tsx`
    - `src/routes/share/preview.tsx`
    - `src/services/analytics-service.ts`
- Key risks and mitigation:
  - Optimistic removal vs async persistence race:
    - Mitigation: keep a pending/removing set keyed by sticker id, lock duplicate taps, and reconcile the optimistic overlay against live `collection` updates each render/effect.
  - Focus loss after DOM removal:
    - Mitigation: compute the next approved focus target before removal, keep element refs by sticker id, and run post-render focus in an effect. Final fallback must be empty-state/back control, never `body`.
  - Drawer regression across multiple hosts:
    - Mitigation: add one optional `onOpenMissing` prop to `MenuDrawer` and update every current host in the same pass.
  - Design/token drift from Pencil S10:
    - Mitigation: reuse existing album semantic tokens first and stop for a token task only if an explicit unmapped style remains.

## Implementation Steps

1. Lock contracts before implementation starts.
   - Confirm S10 light/dark structure, success-toast styling, and empty-state expectations in `docs/design/sticker-tracker.pen`.
   - Confirm current route/controller patterns in `src/routes/stat.tsx`, `src/routes/share/index.tsx`, and `src/routes/share/preview.tsx`.
   - Confirm drawer hosts and current row-order assumptions in `MenuDrawer` tests.
   - Confirm that `/share` already accepts `from=/missing` without code changes.
   - Risk / mitigation: if S10 reveals a true token gap, stop and add a token-specific change instead of hardcoding design values.
2. Execute STR-83 first with pure derived state.
   - Create `src/components/missing/missing-state.ts` with feature-local types and pure helpers.
   - Exact helper responsibilities:
     - iterate `albumPages` in canonical order.
     - compute missing sticker ids per page from `CollectionState`.
     - omit completed pages.
     - expose page-level missing count, total missing count, collected total, album total, and `sharePageIds`.
     - return a dedicated all-complete state when no blocks remain.
     - support an optional optimistic-hidden sticker set so immediate removals use the same derivation logic as persisted state.
   - Add unit coverage in `test/components/missing/missing-state.test.ts` for order, omission, totals, special/team metadata, all-complete state, and optimistic-overlay behavior.
3. Finish STR-83 by wiring the thin `/missing` route.
   - Create `src/routes/missing.tsx` using the same thin-controller style as `/stat` and `/share` routes.
   - Read `AppStateContext`, return `null` until ready, and pass only live `collection`, `toggleCollected`, `onBack`, and `onShare` callbacks into `MissingScreen`.
   - Keep route behavior explicit:
     - direct URL load works.
     - back button always navigates to `/`.
     - share navigation always uses current live missing pages and `from: '/missing'`.
   - Checkpoint: route smoke test proves `/missing` renders from live collection without provider, storage, or share-route changes.
4. Execute STR-82 screen shell before interaction polish.
   - Build `src/components/missing/MissingScreen.tsx` + `.module.css` to match S10 structure in this order:
     - header with back button, centered title, and right-side share action/spacer.
     - progress section with collected/total + missing summary.
     - intro copy.
     - scrollable stacked page blocks.
     - safe-area footer.
     - dedicated all-collected empty state with share CTA hidden and home escape path still visible through the header back action.
   - Reuse current token-backed patterns from `StatsScreen.module.css` and `ShareSelectionScreen.module.css`; no raw copy, colors, spacing, or typography.
   - Add new `missing.*` translations plus `drawer.missing` in en / pt-BR / es.
   - Checkpoint: browser render covers ready + all-complete states in light/dark and translation key trees remain aligned.
5. Execute STR-82 interactions: optimistic removal, toast, motion, focus.
   - In `MissingScreen`, add local UI state for:
     - pending/removing sticker ids
     - toast visibility/message
     - refs for sticker cells and final fallback controls
   - Tap flow:
     - ignore rapid re-tap if sticker already pending/removing.
     - compute the next approved focus target before changing UI.
     - remove the sticker optimistically from visible state immediately.
     - call existing `toggleCollected()` flow so persistence + `stickers_marked_collected` analytics remain unchanged.
     - show the existing collected-success copy path (`scanner.review.success`) in a fast success toast.
   - Implement motion as simple fast fade/collapse only, aligned with existing ~180ms motion conventions.
   - Validation inside this step:
     - sticker disappears immediately.
     - last sticker removes the entire page block.
     - last remaining block switches to dedicated empty state.
     - focus moves next-same-block -> first-next-block -> empty-state/back control, never `body`.
   - Rollback / mitigation: if collapse animation causes instability, keep the optimistic disappearance and reduce animation to opacity-only rather than delaying correctness.
6. Execute STR-81 after the screen works in isolation.
   - Extend `MenuDrawer` with an optional missing-page action and translated label.
   - Wire `onOpenMissing` in every current drawer host:
     - `HomeScreen`
     - `AlbumPageHeader`
     - `NotFoundPage`
   - Keep the share integration minimal:
     - share button on `/missing` derives live `sharePageIds` at click time.
     - navigate to `/share` with `pages=encodeShareSelection(sharePageIds)` and `from='/missing'`.
     - rely on existing share-route back behavior and normal collection recompute when returning.
   - Checkpoint: drawer item opens `/missing`, back returns `/`, share opens with only current missing pages selected, and returning from `/share` / `/share/preview` lands back on `/missing` without snapshot restore.
7. Execute STR-80 with explicit regression layers.
   - Browser/unit strategy:
     - `missing-state.test.ts` for derivation rules.
     - `MissingScreen.browser.test.tsx` for ready/empty states, immediate removal, block collapse, toast, and focus handoff.
     - update drawer host tests to assert missing-row visibility and callback wiring.
   - E2E strategy:
     - `e2e/missing-page-journeys.test.ts` for direct load, page grouping, collect/remove, all-complete empty state, share preselection, and back flow.
     - update `e2e/home-menu-drawer.test.ts` for the new drawer item.
     - update `e2e/a11y-critical-flows.test.ts` for `/missing` light/dark keyboard and axe coverage.
   - i18n regression:
     - extend `test/i18n/translation-resources.test.ts` to include `missing.*` and `drawer.missing`.
   - Analytics regression:
     - verify missing-screen taps still flow only through `AppStateProvider.toggleCollected()` and no new analytics event names are introduced.
8. Run final verification in sequence and stop on the first broken gate.
   - Regenerate `src/routeTree.gen.ts` via the normal TanStack/Vite route generation flow. Never hand-edit it.
   - Run targeted tests after each subtask, then full repo QA with `pnpm complete-check`.
   - Final mitigation note: if late regressions appear, keep `/missing` route + `missing-state.ts` contract stable and back out only screen-level polish, not the core derived-state or navigation contracts.

## Validation

- Success criteria:
  - `/missing` direct URL works and recomputes from live collection state only.
  - Only pages with missing stickers render, in canonical album order, with correct page-level counts and total missing count.
  - Tapping a missing sticker marks it collected through the existing provider flow, removes it immediately from view, shows a success toast, collapses empty page blocks, and reaches the dedicated all-collected state when appropriate.
  - Header share action preselects exactly the pages that currently still have missing stickers and returns from share flow to `/missing`.
  - Drawer item is translated, visible in current drawer hosts, and opens `/missing`.
  - All user-visible copy is i18n-backed in en / pt-BR / es; dark/light styling stays token-backed; no new analytics SDK or event path is added.
  - `pnpm complete-check` passes.
- Checkpoints:
  - Pre-implementation: S10, route patterns, drawer hosts, share contract, and success-toast copy path are audited; no open ambiguities remain.
  - After Step 2: pure unit tests prove order, omission, totals, empty-state model, and optimistic-overlay behavior.
  - After Step 4: browser tests prove the shell matches ready + all-complete states and translation resources stay aligned.
  - After Step 5: browser tests prove immediate removal, block collapse, toast rendering, rapid-tap protection, and focus management.
  - After Step 6: browser/E2E confirm drawer navigation, `/missing` back nav, share preselection, and share-back return to `/missing`.
  - Final: axe coverage, i18n regression, generated route tree, and full `pnpm complete-check` are green.

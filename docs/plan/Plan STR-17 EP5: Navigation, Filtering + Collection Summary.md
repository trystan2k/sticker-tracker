## Task Analysis

- Main objective: Extend the current single-page album viewer into the full STR-17 navigation/filtering flow by adding swipe navigation (`STR-18`), quick page jumping (`STR-19`), and persistent in-session collection filters (`STR-20`), while explicitly keeping `STR-21` collection summary work out of scope for this epic.
- Identified dependencies:
  - `src/data/album.ts` already defines the canonical `albumPages` order, page ids, page types, group metadata, special-page positions, and sticker ids. Navigation and picker behavior must derive from this array only; do not duplicate or reorder album metadata anywhere else.
  - `src/routes/index.tsx` currently seeds `activePageId` with `firstPage` and renders only that page. This is the narrowest place to compose local filter state with the new navigation wrapper without touching global app state.
  - `src/providers/AppStateProvider.tsx` and `src/services/collection-service.ts` already own persisted collection reads/writes. Filtering must stay view-only over `appState.collection`; no new persistence layer, storage key, or provider state should be introduced.
  - `src/components/album-viewer/AlbumViewer.tsx`, `AlbumPageHeader.tsx`, `PageProgress.tsx`, `StickerGrid.tsx`, and `StickerCell.tsx` already match the EP4 screen structure. STR-17 should extend these components instead of replacing them.
  - `src/components/LocaleSwitcher.tsx` already provides the bottom-sheet modal pattern, backdrop/Escape handling, and CSS conventions that the quick navigation picker should reuse.
  - Existing translation resources are sufficient for the current first-page-only flow, but navigation exposes a hidden ambiguity: `fwc-opening` and `fwc-closing` currently resolve to indistinguishable special-page copy in header/picker contexts unless special-page labels are refined.
  - Existing Playwright config is desktop-only (`Desktop Chrome`, `Desktop Safari`). Swipe acceptance should therefore rely on synthetic touch event dispatch against the viewer surface instead of widening the browser matrix unless reliability forces it.
  - Album-order fidelity has one non-obvious constraint: `fwc-opening` is the first page, while `fwc-closing` sits near the album end just before `coca-cola`. Picker sectioning must preserve that order even if it means repeating a history/special header later in the list.
- System impact:
  - Route composition changes, not app architecture. Most of the work stays inside `src/components/album-viewer/` plus a thin update to `src/routes/index.tsx`.
  - Header interaction changes because quick navigation needs a trigger while the existing locale-switcher flow must not regress.
  - Translation coverage expands for picker copy, search/empty-state copy, special-page disambiguation, and any accessibility labels added for the new controls.
  - Test surface expands across unit, browser, and E2E layers for touch behavior, modal behavior, page-order correctness, and cross-page filter persistence.
  - No AppShell, IndexedDB schema, or global context-contract change should be required for this epic.

## Chosen Approach

- Proposed solution:
  - Keep global app state unchanged.
  - Add one small pure helper module under `src/components/album-viewer/` (for example `viewer-state.ts`) as the single source of truth for wrapped page lookup, `SWIPE_THRESHOLD_PX`, picker section derivation in exact album order, and collection-filter application.
  - Introduce `SwipeNavigator` as a thin wrapper around `AlbumViewer`. It owns `activePageId`, touch refs, wraparound navigation, and quick-picker open/close state.
  - Keep `activeFilter` one level above `SwipeNavigator` in the route component so the filter survives both swipe navigation and picker jumps without becoming global state.
  - Build `QuickNavigationPicker` as a bottom-sheet modal that follows the `LocaleSwitcher` structure: overlay/backdrop, drag handle, sheet header, search input, grouped list, and button rows.
  - Extend `AlbumViewer` and `AlbumPageHeader` instead of reworking the screen: the header center metadata block becomes the quick-navigation trigger, the existing menu button keeps opening `LocaleSwitcher`, the current filter pills become real controls, and an in-frame empty state appears when filtered results are zero.
  - Refine special-page display copy so opening and closing pages are distinguishable anywhere navigation can surface them.
- Justification for simplicity:
  - Reject moving navigation/filter state into `AppStateProvider`; page switching and view filtering are screen-local concerns.
  - Reject URL search params or route-per-page deep linking; epic asks for in-view mobile navigation, not shareable permalink state.
  - Reject external gesture, modal, or fuzzy-search libraries; native touch events, simple normalized string matching, and the existing modal pattern are enough for 51 pages.
  - Reject rebuilding `AlbumViewer`; current layout already matches the Pencil frame and only needs behavior added to existing stubs.
  - Reject hardcoded picker ordering/grouping; `albumPages` already prevents drift between dataset, viewer, swipe logic, and picker rendering.
  - Elevated risks / mitigations:
    - Trigger-conflict risk: use the header center block as the quick-picker trigger so the current menu-to-locale flow remains intact. If product later wants the menu icon instead, only `AlbumPageHeader` wiring changes.
    - Special-page ambiguity risk: update special-page copy before picker work so opening and closing never render as indistinguishable rows.
    - Touch-reliability risk: isolate gesture math inside `SwipeNavigator` and the helper module so any browser-specific adjustments stay local.
- Components to be modified/created:
  - Create `src/components/album-viewer/viewer-state.ts` — pure helper module for wrapped navigation, picker section derivation, and filter logic.
  - Create `src/components/album-viewer/SwipeNavigator.tsx` — touch/navigation wrapper around the viewer.
  - Create `src/components/album-viewer/QuickNavigationPicker.tsx` and `src/components/album-viewer/QuickNavigationPicker.module.css` — bottom-sheet page picker patterned after `LocaleSwitcher`.
  - Modify `src/routes/index.tsx` — keep the route thin, own `activeFilter`, and compose `SwipeNavigator` with `AlbumViewer` and existing collection-toggle callbacks.
  - Modify `src/components/album-viewer/AlbumViewer.tsx` and `src/components/album-viewer/AlbumViewer.module.css` — wire interactive filters, filtered grid/empty state, and picker trigger plumbing.
  - Modify `src/components/album-viewer/AlbumPageHeader.tsx` and `src/components/album-viewer/AlbumPageHeader.module.css` — add quick-picker trigger support while preserving locale-menu behavior.
  - Modify `src/components/album-viewer/StickerGrid.tsx` (and CSS only if needed) — accept a filtered sticker id list instead of always rendering the full `page.stickerIds` array.
  - Modify `src/locales/en/translation.json`, `src/locales/es/translation.json`, and `src/locales/pt-BR/translation.json` — picker strings, filter empty-state copy, special-page disambiguation, trigger labels.
  - Add or update tests:
    - `test/components/album-viewer/viewer-state.test.ts`
    - `test/components/album-viewer/SwipeNavigator.browser.test.tsx`
    - `test/components/album-viewer/QuickNavigationPicker.browser.test.tsx`
    - `test/components/album-viewer/AlbumViewer.browser.test.tsx`
    - `test/components/Home.browser.test.tsx`
    - `test/i18n/translation-resources.test.ts`
    - `e2e/swipe-navigation.test.ts`
    - `e2e/quick-navigation-picker.test.ts`
    - `e2e/collection-filter-persistence.test.ts`
  - Keep `src/providers/AppStateProvider.tsx`, `src/services/collection-service.ts`, and the storage schema unchanged unless a regression proves otherwise.

## Implementation Steps

1. Establish shared viewer-state helpers and close the copy gaps that navigation will expose.
   - Create `src/components/album-viewer/viewer-state.ts` with pure, non-React helpers driven by `albumPages`: active-page lookup, next/previous page resolution with wraparound, order-preserving section/run derivation for picker rendering, and filter application for `all | collected | missing`.
   - Export a named swipe-threshold constant (for example `SWIPE_THRESHOLD_PX`) from this module so implementation and tests use one source of truth.
   - Refine translation copy before UI wiring so `fwc-opening` and `fwc-closing` render distinct human-readable labels in both header and picker contexts. Keep the `page.translationKey` contract intact; only adjust copy and any needed companion picker/section keys.
   - Add unit coverage in `test/components/album-viewer/viewer-state.test.ts` for exact album order, first/last wraparound, repeated special-section handling, and filter results against sample collected sets.
   - Pre-implementation correctness check: verify helper tests prove `fwc-closing` stays near album end and picker grouping does not reorder it toward the top.

2. Execute STR-18 by introducing `SwipeNavigator` as the only page-navigation owner.
   - Create `src/components/album-viewer/SwipeNavigator.tsx` around the existing viewer surface. It should own `activePageId`, derive the active `AlbumPage` from `albumPages`, and expose the current page plus navigation handlers needed by the route/viewer composition.
   - Implement touch handling with start/end refs and axis detection: horizontal movement must exceed `SWIPE_THRESHOLD_PX` and beat vertical delta before page changes are allowed; vertical drags must fall through as scroll.
   - Keep wraparound behavior inside the helper module so swiping backward on the first page lands on `coca-cola`, and swiping forward on the last page lands on `fwc-opening`.
   - Do not move collection state into `SwipeNavigator`; it should only own page navigation and picker visibility so the route can keep using `appState.collection` and `toggleCollected` unchanged.
   - Add browser coverage in `test/components/album-viewer/SwipeNavigator.browser.test.tsx` for left/right swipes, wraparound, below-threshold no-op, and vertical-scroll no-op.
   - Add Playwright `e2e/swipe-navigation.test.ts` that dispatches synthetic touch events against a stable viewer target and proves page changes follow exact album order.
   - Rollback / mitigation: if gesture cancellation becomes flaky across engines, keep the `SwipeNavigator` public API stable and adjust only internal axis-lock / `preventDefault` logic instead of pushing navigation state down into `AlbumViewer`.

3. Re-compose the home route around navigation without changing global app architecture.
   - Refactor `src/routes/index.tsx` so `Home` becomes a thin screen controller: read `AppStateContext`, keep `activeFilter` in local state, preserve the existing latest-collection ref pattern for toggles, and render `SwipeNavigator` plus `AlbumViewer`.
   - Ensure `Home` does not own `activePageId` anymore if `SwipeNavigator` is the canonical page-state owner; page data should flow from the wrapper back into the rendered viewer.
   - Preserve existing loading/ready handling. STR-17 should not require provider or shell changes.
   - During-implementation correctness check: `test/components/Home.browser.test.tsx` still proves the route renders the viewer and sticker grid after bootstrap, now through the wrapper composition.

4. Execute STR-19 by building the quick navigation picker on top of the existing modal pattern.
   - Create `src/components/album-viewer/QuickNavigationPicker.tsx` using the `LocaleSwitcher` structure: fixed overlay/backdrop, bottom sheet, drag handle row, sheet header, close button, search input, and scrollable page list.
   - Use the helper module to build the picker list in exact album order, then render section headers as order-preserving runs. This keeps the UI faithful to the real album sequence even when history/special headers repeat later in the list.
   - Render team rows with flag, translated name, group label, and per-page collected/total count when available from `appState.collection`; render special rows with translated title, distinguishing subtitle/section label, and optional progress count to stay close to Pencil without introducing STR-21 summary scope.
   - Search must be case-insensitive and operate on translated display text while preserving original order; empty sections should collapse automatically after filtering.
   - Selecting a row must navigate to its page and close the sheet in one action. Escape key, backdrop click, close button, and keyboard tab/Enter flows must work through native controls.
   - Use the header center metadata block as the picker trigger so the current menu button can keep opening `LocaleSwitcher`; add explicit `onOpenQuickNavigation` props rather than embedding picker state inside `AlbumPageHeader`.
   - Add browser tests for open/close behavior, search narrowing, exact first/last entries, keyboard reachability, and row selection. Add Playwright `e2e/quick-navigation-picker.test.ts` for a direct-jump scenario from an early album page to a late page and back.
   - Risk checkpoint: verify opening and closing rows are visually distinguishable before accepting STR-19.

5. Update the existing viewer/header components to support the picker and special-page copy cleanly.
   - Extend `AlbumViewer.tsx` props with `activeFilter`, `onChangeFilter`, and `onOpenQuickNavigation`. The viewer remains the layout orchestrator for header, progress, filter row, content, swipe hint, and safe area.
   - Extend `AlbumPageHeader.tsx` to accept `onOpenQuickNavigation`; render the center metadata block inside a visually reset button that preserves the current Pencil layout while becoming keyboard accessible.
   - Preserve current camera/share icons and the existing `LocaleSwitcher` flow. Do not merge locale switching into the new picker.
   - Revisit special-page header rendering so navigation to `fwc-opening` and `fwc-closing` clearly shows distinct secondary text aligned with the updated copy contract.
   - Regression checkpoint: existing locale modal browser/E2E coverage must still pass after header wiring changes.

6. Execute STR-20 by turning the filter pills into real persistent viewer controls.
   - Keep `activeFilter` state outside page-specific components so it survives both swipe navigation and picker jumps until the user explicitly changes it.
   - Replace the three disabled pills in `AlbumViewer` with real buttons using `aria-pressed` or an equivalent active-state signal; keep current visual tokens and only switch modifier classes/handlers.
   - Filter the rendered sticker ids via the shared helper module: `all` returns every sticker, `collected` returns only ids present in the page collection set, and `missing` returns only ids not present in the set.
   - Modify `StickerGrid` so it can render a provided `visibleStickerIds` list instead of always iterating `page.stickerIds`.
   - Add a translated empty state inside the viewer content area when the current filter yields zero stickers. Keep `PageProgress` based on the full page collection, not the filtered subset, so progress remains semantically stable across filter changes.
   - Add browser coverage for active pill styling/state, collected-only rendering, missing-only rendering, and empty-state rendering on pages without matching stickers.
   - Add Playwright `e2e/collection-filter-persistence.test.ts` that applies a filter, changes pages, and proves the same filter remains active until manually changed.
   - Rollback / mitigation: if filter logic and grid rendering drift, revert only the `visibleStickerIds` plumbing and keep the state/helper contract stable.

7. Expand i18n and regression coverage only where navigation/filtering introduces new surface area.
   - Update `test/i18n/translation-resources.test.ts` to assert the new picker keys, filter-empty-state copy, and special-page disambiguation keys exist in all locales and stay aligned.
   - Keep current `test/data/album.test.ts` dataset integrity assertions intact; only adjust expectations if the improved special-page copy requires clearer translation assertions elsewhere.
   - Prefer accessible roles/names in new tests; add a stable test id only for the swipe surface if no semantic selector remains reliable for synthetic touch dispatch.
   - Regression gate: existing toggle persistence, locale persistence, and root-shell tests should remain green without provider or storage changes.

8. Run final verification in epic order and stop on the first broken gate.
   - After STR-18: unit, browser, and Playwright coverage proves wraparound and vertical-scroll protection.
   - After STR-19: picker order, search, direct-jump behavior, keyboard access, and locale-trigger preservation all pass.
   - After STR-20: active filter survives page changes, empty state is translated, and progress/toggle behavior still reflect the underlying collection correctly.
   - Final QA gate: run `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, then `pnpm complete-check`.
   - Final mitigation note: if a late regression appears, keep `viewer-state.ts` and route-level filter ownership intact; those are the contracts later epics can safely extend without another navigation rewrite.

## Validation

- Success criteria:
  - STR-18: swiping left/right changes pages in exact `albumPages` order, first/last wraparound works, and below-threshold or vertical gestures do not trigger page changes.
  - STR-19: the quick navigation picker opens from the current page metadata, lists pages in exact album order, search narrows results without reordering them, selecting a row navigates and closes the sheet, keyboard users can open/search/select/close it, and the locale menu flow still works.
  - STR-20: `All`, `Collected`, and `Missing` filters work on the current page, active filter styling is obvious, the same filter survives page changes until explicitly changed, and translated empty-state copy appears when no stickers match.
  - Special pages: opening and closing are visually distinguishable in both header and picker once navigation reaches them.
  - Repo-level: no new global store/persistence layer is introduced, no STR-21 summary work is accidentally pulled in, and `pnpm complete-check` passes.
- Checkpoints:
  - Pre-implementation: helper unit tests confirm canonical page order, wraparound, special-section handling, and filter logic before UI wiring begins.
  - After STR-18: browser plus Playwright swipe tests pass on the wrapper without any provider/storage changes.
  - After route/header wiring: `Home.browser.test.tsx` and existing locale tests confirm viewer rendering and regression-free header composition.
  - After STR-19: browser tests confirm row order, search behavior, keyboard interaction, and row selection; Playwright direct-jump confirms real modal/navigation behavior.
  - After STR-20: browser and Playwright tests confirm active pill persistence across page changes, correct empty-state rendering, and unchanged toggle/progress persistence.
  - Final: full QA suite is green and the implementation leaves clear extension points for later summary work without another navigation/filter rewrite.

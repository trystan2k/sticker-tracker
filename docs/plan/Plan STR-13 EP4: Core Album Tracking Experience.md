## Task Analysis

- Main objective: Replace current home placeholder with a mobile-first album viewer that can render both `TeamPage` and `SpecialPage` layouts, show in-frame loading before persisted collection finishes resolving, surface per-page progress, and let users toggle sticker ownership with persistence and keyboard-accessible controls in strict order `STR-14 → STR-16 → STR-15`.
- Identified dependencies:
  - `src/data/album.ts` already provides page order, `AlbumPage` discriminated unions, `translationKey`, `group`, `flagCode`, and `stickerIds`; viewer must consume this directly instead of duplicating page metadata.
  - `src/services/collection-service.ts` and `src/providers/AppStateProvider.tsx` already own persisted collection reads/writes; UI should reuse `collection`, `renderState`, and `toggleCollected` instead of introducing a second store.
  - `src/components/AppShell.tsx` already wraps the route; only minimal shell adjustment should be made if full-bleed viewer layout needs it.
  - Translation resources are currently foundation-only; epic needs new viewer copy plus full album key coverage (`team.*`, `group.*`, `special.*`) without breaking `t(page.translationKey)`.
  - Pencil inspection exposed 3 non-obvious constraints that implementation must honor early: (1) `AppStateProvider` currently blocks route rendering during loading, so in-view loading cannot happen without a provider change; (2) team/history pages use a 4-column sticker grid while Coca-Cola uses 5 columns; (3) current built token CSS does not visibly expose the cream album surfaces from Pencil, so token parity must be validated before styling work proceeds.
  - Likely UI dependencies missing from `package.json`: `flag-icons` for team flags and `lucide-react` for collected/check, swipe hint, and any decorative header icons.
- System impact:
  - Route layer: `src/routes/index.tsx` stops being a text-only foundation screen and becomes the first real feature screen.
  - Provider/bootstrap layer: loading behavior must shift so the route can render a skeleton/spinner while collection state resolves, while existing blocking `storage-error` behavior can stay intact.
  - Styling layer: new CSS Modules will consume token variables, possibly after a token-source update/rebuild if current `design-tokens/dist/*.css` does not match Pencil viewer surfaces.
  - Test layer: browser tests, i18n resource tests, and E2E smoke/persistence tests all need retargeting from the old welcome screen to the album viewer.

## Chosen Approach

- Proposed solution: Build a small `album-viewer` component set under `src/components/album-viewer/`, keep `AppStateProvider` as the only collection source of truth, let `Home` own only a minimal `activePageId` state seeded from the dataset, and render a page-agnostic `AlbumViewer` that switches between team and special variants from the `AlbumPage` union. Use CSS Grid for sticker layout with a tiny page-based column helper (`4` default, `5` for Coca-Cola), keep filter pills and swipe hint presentational, and defer real navigation/filter state to later epics.
- Justification for simplicity:
  - Reject a new global store/reducer; existing provider already owns bootstrap, locale, collection, and persistence.
  - Reject manual row-by-row sticker markup like the `.pen` file uses internally; CSS Grid reproduces the same visual result with less code and automatically handles 9/11/14/20 sticker page counts.
  - Reject route-to-shell header slot plumbing in this epic; keep shell responsibilities stable and render album page metadata inside the viewer, which is cheaper and less risky than adding cross-route shell coordination before navigation exists.
  - Reject fake interactive filters/navigation; pills and swipe hint should be visible but semantically non-interactive until later epics add real behavior.
  - Reject hardcoded fallback colors if token parity is missing; first fix token source/build so UI still obeys project rule: token-backed values everywhere.
  - Elevated risk/mitigation:
    - Provider loading refactor risk: keep `storage-error` blocking branch unchanged and only relax the `loading` branch so regressions stay narrow.
    - Token parity risk: if album viewer surface/header colors are not present in built tokens, patch `design-tokens/semantic/*.json` and rebuild before CSS implementation, not after.
    - Flag risk: verify `flag-icons` supports `gb-eng` and `gb-sct` early; if not, stop and define fallback strategy before header work spreads.
- Components to be modified/created:
  - `package.json` — add `flag-icons` and `lucide-react` if absent; no broader UI library changes.
  - `src/styles.css` — import flag icon CSS globally if dependency is added; do not add page-specific styling here.
  - `src/providers/AppStateProvider.tsx` — render children during `loading` so route-level skeleton/spinner can appear; keep context contract stable.
  - `src/components/AppShell.module.css` — likely reduce/remove `main` padding so viewer sections can own exact Pencil spacing; leave shell structure intact.
  - `src/routes/index.tsx` — replace home placeholder with route-level album viewer screen; keep only `activePageId` local state.
  - `src/components/album-viewer/AlbumViewer.tsx` — props: `{ page: AlbumPage; renderState: 'loading' | 'ready'; collectedStickerIds: ReadonlySet<StickerIdentifier>; onToggleSticker: (stickerId: StickerIdentifier) => Promise<void> | void; }`; orchestrates header/progress/filter/grid/swipe/safe-area sections.
  - `src/components/album-viewer/AlbumViewer.module.css` — outer frame, section backgrounds, loading shell, filter row, swipe hint, safe area.
  - `src/components/album-viewer/AlbumPageHeader.tsx` — props: `{ page: AlbumPage; }`; renders team flag/name/group or special title/section label, plus optional decorative icons marked `aria-hidden` only if design parity requires them now.
  - `src/components/album-viewer/AlbumPageHeader.module.css` — title row, flag sizing, group badge, sponsor modifier styling.
  - `src/components/album-viewer/PageProgress.tsx` — props: `{ collectedCount: number; totalCount: number; }`; renders collected/total text, percentage, and accessible progress bar.
  - `src/components/album-viewer/PageProgress.module.css` — label row, track, fill, percent emphasis.
  - `src/components/album-viewer/StickerGrid.tsx` — props: `{ page: AlbumPage; collectedStickerIds: ReadonlySet<StickerIdentifier>; disabled?: boolean; onToggleSticker: (stickerId: StickerIdentifier) => Promise<void> | void; }`; derives column count and maps sticker IDs to cells.
  - `src/components/album-viewer/StickerGrid.module.css` — 4-column/5-column grid variants, responsive gaps, row flow.
  - `src/components/album-viewer/StickerCell.tsx` — props: `{ page: AlbumPage; stickerId: StickerIdentifier; isCollected: boolean; disabled?: boolean; onToggle: () => Promise<void> | void; }`; native button with visual state and accessible state.
  - `src/components/album-viewer/StickerCell.module.css` — collected/missing modifiers, focus ring, code/number typography, check icon alignment.
  - `src/locales/{en,es,pt-BR}/translation.json` — expand viewer strings and full album key coverage.
  - `test/components/Home.browser.test.tsx` — retarget smoke coverage to viewer screen.
  - `test/providers/AppStateProvider.browser.test.tsx` — update loading expectation now that children render during bootstrap.
  - `test/i18n/translation-resources.test.ts` — add album dataset-backed translation presence checks, not only tree parity.
  - `test/components/album-viewer/AlbumViewer.browser.test.tsx` — new browser coverage for loading/team/special render.
  - `test/components/album-viewer/StickerGrid.browser.test.tsx` — new browser coverage for click/keyboard toggle, progress refresh, and persistence after remount.
  - `e2e/welcome-message.test.ts` — repurpose into viewer smoke/i18n test or replace with equivalently scoped viewer smoke.
  - `e2e/locale-persistence.test.ts` — retarget locale assertions to album viewer text.
  - `e2e/album-toggle-persistence.test.ts` — new E2E flow for click → progress update → reload persistence.
  - Conditional token files if parity gap is real: `design-tokens/semantic/color.tokens.json` and rebuilt `design-tokens/dist/{semantic,components}.css`.

## Implementation Steps

1. Lock the contract and remove two known blockers before UI work starts.
   - Validate built token parity against Pencil for album viewer surfaces/header colors. Current `semantic.css` still exposes forest/white surfaces, while Pencil viewer uses cream surfaces. If mismatch is confirmed, update semantic token source first and rebuild with `pnpm tokens:build`; do not hardcode raw colors in component CSS.
   - Confirm `AppStateProvider` loading branch currently prevents route rendering. Minimal approved fix: always render `I18nextProvider` + `AppStateContext.Provider` during `loading`, but keep the existing translated blocking `storage-error` branch for failure handling.
   - Add only the missing UI dependencies needed for faithful viewer rendering: `flag-icons` and `lucide-react`. Reject any larger component/icon library expansion.
   - Pre-implementation correctness check: verify `flag-icons` covers dataset edge cases `gb-eng` and `gb-sct`; if not, pause STR-16 and choose an explicit fallback.

2. Execute STR-14 by introducing the viewer frame and route-level loading state.
   - Modify `src/routes/index.tsx` to replace home placeholder copy with a route-level album viewer screen that reads `AppStateContext`, keeps a tiny `activePageId` state seeded from `albumPages`, derives `activePage`, and passes `renderState`, `collection[activePage.pageId] ?? new Set()`, and `toggleCollected` down to `AlbumViewer`.
   - Create `AlbumViewer.tsx` + `AlbumViewer.module.css` with the full screen skeleton structure now, even before all content is live: header area, progress section, filter row, sticker region, swipe hint, safe area. Use token-backed spacing/radius/typography only.
   - Implement route-visible loading UI inside `AlbumViewer` for `renderState === 'loading'`. Prefer a skeleton shaped like the final viewer sections rather than a global text-only spinner so STR-14 proves the final container/layout already exists.
   - Keep filter pills and swipe hint presentational from day one. Use non-interactive elements (`<span>` / `<ul>` / `<p>`) so semantics stay honest until later epics add actual behavior.
   - Adjust `AppShell.module.css` only as needed to let the viewer own exact edge-to-edge section spacing. Favor removing generic `main` padding over compensating with negative margins.
   - Rollback/mitigation: if provider changes destabilize error handling, revert to provider-controlled error UI but keep the relaxed loading behavior so STR-14 acceptance still holds.

3. Finish STR-14 support for both page modes without introducing navigation.
   - Make `AlbumViewer` discriminate on `page.type` and `page.key`, even if only one page is reachable in the route today.
   - Add small local helpers for display-only derivations: sticker prefix (`albumCode`, `FWC`, `CC`), special section tone, and grid column count. Keep these local to viewer components unless they clearly need reuse elsewhere.
   - Use CSS Grid instead of row wrappers. Default to 4 columns for team/history pages and 5 columns for Coca-Cola. This keeps layout responsive and matches the inspected Pencil screens more closely than a single fixed column token.
   - Browser-test both a representative `TeamPage` and a representative `SpecialPage` directly at component level so support for both modes is proven before navigation exists.

4. Execute STR-16 by turning placeholder metadata into real page headers and progress.
   - Create `AlbumPageHeader.tsx` + CSS module. Team variant must render translated team name from `t(page.translationKey)`, team flag from `page.flagCode`, and translated group label from `t(`group.${page.group.toLowerCase()}`)`. Special variant must render translated page title plus a translated section label derived from `page.key`.
   - Keep `page.translationKey` as a leaf string key. Do not restructure `special.*` or `team.*` into nested objects that would break `t(page.translationKey)`.
   - Create `PageProgress.tsx` + CSS module. Derive `collectedCount` from the current page set size, `totalCount` from `page.stickerIds.length`, and `percentage` from those values. Add `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` so the visual bar is not decorative only.
   - Expand all three locale files with the keys required for this step:
     - `team.{48 page ids}`
     - `group.{a..l}`
     - `special.{fwc-opening,fwc-closing,coca-cola}`
     - `album.specialSection.{fwc-opening,fwc-closing,coca-cola}`
     - `album.progress.collected`
     - `album.loading`
     - `album.filters.{label,all,collected,missing}`
     - `album.swipeHint`
     - optional accessibility helpers if explicit spoken labels are preferred (`album.progress.ariaLabel`, `album.sticker.collected`, `album.sticker.missing`)
   - Correctness check after STR-16: team header, special header, and progress browser tests should all pass without any toggle implementation yet.

5. Execute STR-15 by implementing the real sticker grid and toggle behavior.
   - Create `StickerGrid.tsx` + `StickerCell.tsx` and their CSS Modules. Each sticker must render as a native `<button type="button">`, not a `div`, so keyboard support and focus behavior come for free.
   - `StickerCell` should expose meaningful state via `aria-pressed={isCollected}`. Visible content must include the sticker code/number so each button already has a unique accessible name; add a translated `aria-label` only if browser/screen-reader testing shows the visible code is too terse.
   - Use token-backed collected/missing variants and a focus-visible ring. With `lucide-react`, render the collected check icon directly inside the button; do not fake it with background images.
   - Wire cell clicks to `appState.toggleCollected(appState.collection, page.pageId, stickerId)` through the `onToggleSticker` prop chain. Do not introduce a second optimistic collection store unless browser tests reveal visible lag.
   - Update `PageProgress` and cell state from the same provider collection so a successful toggle refreshes progress/counts and cell styling from one source of truth.
   - Persistence correctness check: remount/browser reload must show the same toggled cell still collected because the existing service persists immediately.

6. Retarget and expand automated coverage around the new viewer.
   - Update `test/providers/AppStateProvider.browser.test.tsx` so loading-state expectations match the new contract: children can render during bootstrap, while `storage-error` stays blocking.
   - Rewrite `test/components/Home.browser.test.tsx` to assert viewer smoke instead of old title/subtitle copy.
   - Add `test/components/album-viewer/AlbumViewer.browser.test.tsx` for:
     - loading skeleton visible while provider is still bootstrapping,
     - team page metadata render,
     - special page metadata render,
     - presentational filters/swipe hint visible and non-interactive.
   - Add `test/components/album-viewer/StickerGrid.browser.test.tsx` for:
     - 4-column vs 5-column layout selection,
     - click toggle,
     - keyboard toggle via Enter/Space,
     - `aria-pressed` state changes,
     - per-page progress updates after toggle,
     - persistence after unmount/remount with real storage.
   - Strengthen `test/i18n/translation-resources.test.ts` so it not only checks key-tree parity, but also iterates `albumPages` and asserts every dataset `translationKey`, every group label, and every new special section key exists in each locale.
   - Retarget E2E coverage:
     - viewer smoke/i18n assertions on the new route,
     - locale persistence against viewer-visible translated text,
     - new toggle persistence flow using one sticker and reload.

7. Run epic verification in subtask order and stop on the first broken gate.
   - After STR-14: verify route renders album viewer frame plus in-view loading state before collection readiness.
   - After STR-16: verify translated team/special metadata and page progress render from real dataset/context values.
   - After STR-15: verify click + keyboard toggle updates UI immediately enough for browser tests and survives reload.
   - Final QA gate: run `pnpm tokens:build` (if token source changed), `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, then `pnpm complete-check`.
   - Rollback/mitigation: if a late-stage toggle regression appears, keep STR-14/STR-16 viewer rendering intact and isolate the fix to `StickerGrid`/`StickerCell` wiring instead of undoing the whole screen conversion.

## Validation

- Success criteria:
  - STR-14: `/` renders the album viewer container instead of the old foundation copy, and a token-backed loading skeleton/spinner appears inside that viewer before persisted collection data is ready.
  - STR-14: the viewer component accepts both `TeamPage` and `SpecialPage` data and renders the correct structural variant for each, even if route navigation is not live yet.
  - STR-16: team pages show translated team name, flag, and translated group label; special pages show translated title and translated section label; per-page collected/total and percentage match provider collection state.
  - STR-15: sticker cells render for the active page, toggle via click and keyboard, expose meaningful accessible names/states, and remain collected after reload through the existing persistence layer.
  - Repo-level: no new global state library, no fake filter/navigation behavior, no coverage-threshold change, and all styling stays token-based.
- Checkpoints:
  - Pre-implementation: confirm token parity gap and provider loading blocker; do not begin CSS or viewer tests until both are explicitly addressed.
  - After provider change: browser test proves children render during `loading` while `storage-error` still blocks.
  - After STR-14: home route smoke test proves viewer shell exists, loading state is in-frame, and presentational filter/swipe surfaces render without handlers.
  - After STR-16: browser tests prove both representative page modes render correct translated metadata, and progress bar/count math is correct for 0-collected and non-zero-collected states.
  - After STR-15: browser/E2E tests prove `aria-pressed` changes, keyboard interaction works, progress increments/decrements correctly, and reload restores state.
  - Final: `pnpm complete-check` passes, and implementation is ready for later swipe navigation, team picker, and real filter behavior without another layout rewrite.

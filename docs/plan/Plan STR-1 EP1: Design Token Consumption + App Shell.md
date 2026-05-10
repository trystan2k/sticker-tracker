## Task Analysis

- Main objective: Deliver epic STR-1 by wiring generated design tokens into global styles, replacing route-level starter chrome with a reusable product app shell, and moving the persisted locale switcher into the shared shell header.
- Identified dependencies:
  - STR-3 is already done and provides `AppStateProvider`, `AppStateContext`, `setLocale`, locale persistence, and root bootstrap behavior that this shell must reuse instead of reimplementing.
  - Token source of truth already exists at `design-tokens/dist/{primitives,semantic,components}.css`; import order must stay `primitives -> semantic -> components`.
  - App shell entry points are `src/styles.css`, `src/routes/__root.tsx`, and `src/routes/index.tsx`; remaining starter metadata also still exists in `public/manifest.json`.
  - Existing E2E coverage in `e2e/welcome-message.test.ts` and `e2e/locale-persistence.test.ts` already validates visible locale switching and can be retargeted to the shared shell instead of adding duplicate persistence tests.
  - Design system expects token usage everywhere; shell styling must stay token-backed and align with future header/navigation/toast work.
- System impact: This epic changes app-wide styling baseline, root render structure, shared UI chrome, and product metadata. Later navigation, summary, scanner slot, overlay, and toast tasks will build on this shell, so structure should be stable but intentionally minimal.

## Chosen Approach

- Proposed solution: Add one small `AppShell` component plus one focused `LocaleSwitcher` component, wire both from `src/routes/__root.tsx`, import token CSS globally in `src/styles.css`, simplify `src/routes/index.tsx` back to route content only, and reserve empty shell regions/DOM anchors for header, navigation, overlay, and toast surfaces. Update root head metadata and leftover starter manifest strings in the same pass.
- Justification for simplicity:
  - Reject adding new global UI state, portal manager, or an extra layout-route layer; root already owns shared chrome and provider state.
  - Reject keeping locale switcher inline on `/`; header-level placement matches the PRD and prevents duplication once more routes/screens arrive.
  - Reject building actual navigation drawer or toast behavior now; stable named regions are enough for later tasks without premature implementation.
  - Reuse existing locale persistence, translation keys, and `SUPPORTED_LOCALES`; do not add new i18n abstractions.
  - Elevated risk to check first: token CSS currently carries `rpx` spacing/typography values. Validate immediately that imported tokens produce usable computed styles in the browser; if they do not, stop and escalate token-pipeline correction instead of hardcoding px replacements.
- Components to be modified/created:
  - `src/styles.css` — import `../design-tokens/dist/primitives.css`, `semantic.css`, `components.css`; add token-backed global baseline.
  - `src/components/AppShell.tsx` — shared product shell wrapper with header, content slot, and future surface containers.
  - `src/components/AppShell.module.css` — shell layout/styling using token custom properties only.
  - `src/components/LocaleSwitcher.tsx` — header locale selector extracted from `src/routes/index.tsx` and backed by `AppStateContext`.
  - `src/components/LocaleSwitcher.module.css` — locale switcher styling using token variables.
  - `src/routes/__root.tsx` — keep document shell, compose `AppShell`, preserve language sync, and replace remaining starter metadata with product metadata.
  - `src/routes/index.tsx` — remove inline locale selector and leave route-specific home content inside the shell content region.
  - `public/manifest.json` — replace starter app name/short name/theme colors so product metadata no longer conflicts with shell branding.
  - `e2e/welcome-message.test.ts` and `e2e/locale-persistence.test.ts` — retarget acceptance checks to shared shell/header behavior.
  - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-1 EP1: Design Token Consumption + App Shell.md` — generated execution plan file.

## Implementation Steps

1. Lock scope and validate token readiness before structural edits.
   - Confirm STR-3 dependency is satisfied and reuse `AppStateContext` + existing locale persistence contract as-is.
   - Import token CSS early in a working branch and inspect computed browser styles for the token categories the shell needs first: colors, header height, borders, font family, plus any spacing/typography tokens referenced by shell CSS.
   - Elevated risk: `rpx` values may be invalid in browser CSS. Rollback/mitigation: if computed styles fail, stop at STR-10 and route the issue back to the token pipeline instead of introducing raw-value fallbacks.
2. Execute STR-10 in `src/styles.css`.
   - Add `@import` lines in this order: `primitives.css`, `semantic.css`, `components.css`.
   - Extend the global baseline only as far as needed for shell consumption: reset box sizing, preserve full-height layout, set `color-scheme`, and apply token-backed canvas background, text color, font family, and form-control inheritance.
   - Keep resets minimal; global CSS should establish app-wide defaults, not encode page-specific layout.
   - Correctness check: app boots with no broken imports and root/body computed styles resolve from token variables.
3. Execute STR-11 by introducing the product app shell and cleaning metadata.
   - Create `src/components/AppShell.tsx` with semantic regions for `header` and `main`, plus empty structural containers or stable DOM anchors for `navigation`, `overlay`, and `toast` surfaces.
   - Keep `AppShell` dumb: no new reducer, no new provider, no premature portal infrastructure. It should only render shared chrome around routed children.
   - Create `src/components/AppShell.module.css` with token-backed layout: full-height shell, sticky/fixed header using header tokens, scrollable content area, and future surface layers that stay inert when empty.
   - Update `src/routes/__root.tsx` to render `<AppShell>{children}</AppShell>` inside `AppStateProvider`, preserve `RootLanguageSync`, and replace metadata with product values such as title, description, and theme-color aligned with the design tokens.
   - Update `public/manifest.json` to replace the remaining starter `name`, `short_name`, and theme/background values with product values so browser-install metadata matches the app shell. Rollback/mitigation: if manifest wiring is intentionally deferred to later PWA work, update the file only and avoid adding new runtime manifest plumbing now.
4. Execute STR-12 by moving locale switcher into the shared header.
   - Extract the current select logic from `src/routes/index.tsx` into `src/components/LocaleSwitcher.tsx`, preserving `SUPPORTED_LOCALES`, the supported-locale guard, `AppStateContext`, `setLocale`, existing translation keys, and the `#locale-switcher` id so E2E selectors stay stable.
   - Style the control via `LocaleSwitcher.module.css`; keep the native `<select>` instead of introducing Base UI or a custom popup before needed.
   - Render `LocaleSwitcher` inside the `AppShell` header beside product title/branding, then remove the duplicated locale UI from `src/routes/index.tsx`.
   - Simplify `src/routes/index.tsx` to route content only, keeping translated proof-of-life copy inside the shell `main` region.
5. Re-align tests and run epic verification.
   - Update `e2e/welcome-message.test.ts` to assert shared header/shell rendering, translated home content inside `main`, and locale control presence in the header rather than the route body.
   - Update `e2e/locale-persistence.test.ts` to keep current persistence assertions while targeting the header-mounted switcher.
   - Only add a dedicated shell component test if the new shell introduces non-trivial conditional rendering; otherwise reuse existing provider coverage plus E2E to avoid redundant tests.
   - Run `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, then `pnpm complete-check` as the final QA gate.

## Validation

- Success criteria:
  - STR-10: `src/styles.css` imports all three generated token CSS files in the correct order and the app consumes token-backed global styles without ad-hoc raw design values.
  - STR-11: a shared product shell wraps routed content, exposes header/content/navigation/overlay/toast surfaces, and starter metadata is replaced in root head and starter manifest values are removed.
  - STR-12: locale switcher is rendered in the shell header, uses the existing persistence flow, and the selected locale survives reload with translated UI and `<html lang>` updated.
  - Repo-level: no new state library, no theme-system rewrite, no coverage-threshold change, and `pnpm complete-check` passes.
- Checkpoints:
  - Pre-implementation: verify token CSS imports resolve and inspect computed styles for at least one color token and one spacing/typography token; escalate immediately if `rpx` output is unusable in browser CSS.
  - After STR-10: confirm global background, text, and font render from token variables and dark-mode token cascade still works via `[data-theme]` / `prefers-color-scheme`.
  - After STR-11: confirm header remains visible across routed content, empty navigation/overlay/toast containers do not affect layout when unused, and document title/description no longer reflect starter defaults.
  - After STR-12: E2E proves locale switcher lives in the shell header, locale persists after reload, and the home route no longer duplicates locale controls.
  - Final: `pnpm complete-check` passes and the shell is ready for later quick navigation, summary entry, scanner slot, and update-toast work without another root-layout rewrite.

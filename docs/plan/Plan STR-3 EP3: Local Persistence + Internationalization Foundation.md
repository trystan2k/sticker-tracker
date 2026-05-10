## Task Analysis

- Main objective: Deliver epic STR-3 by building persistence and localization foundations in strict order `STR-7 → STR-8 → STR-9`, so collection state and locale survive reloads and app can bootstrap safely in a client-only offline-first runtime.
- Identified dependencies:
  - Existing album source of truth in `src/data/album.ts` provides `PageId` and `StickerIdentifier` shapes for persisted collection data.
  - App shell entry points are `src/routes/__root.tsx`, `src/routes/index.tsx`, and `src/router.tsx`; storage and i18n bootstrapping must fit this TanStack Start SPA shell without module-scope browser API reads.
  - `package.json` lacks `idb`, `i18next`, and `react-i18next`; tests currently use `vitest.config.ts`, `test/setup/shared.ts`, `test/setup/browser.ts`, and Playwright `e2e/` coverage.
  - PRD requires locale resources at `src/locales/{locale}/translation.json`, fallback locale `en`, and locale detection from saved preference before browser-language fallback.
  - Confirmed user decision overrides PRD fallback-toast behavior: if IndexedDB cannot support durable persistence, app must stop and show blocking error; if storage is unrecoverable/corrupted, app must offer explicit delete-all-data recovery.
- System impact: This epic introduces first browser-persistence layer, first app-wide runtime bootstrap, and first translation system. Root rendering flow changes from static starter content to gated initialization with loading, blocking storage recovery, locale hydration, and persistence-backed state services that later viewer/filter/share/PWA work will depend on.

## Chosen Approach

- Proposed solution: Add one small typed IndexedDB adapter around `idb`, two thin services on top of it (`collection` and `locale`), and one root bootstrap/provider that resolves storage + initial locale before rendering app content. Then initialize `react-i18next` with bundled JSON resources and a tiny locale matcher that prefers saved locale, then browser languages, then `en`.
- Justification for simplicity:
  - Reject Zustand/Redux/global-store introduction; React state + thin services are enough for this scope.
  - Reject direct `indexedDB` calls inside routes/components; one adapter keeps failure handling, reset flow, and tests centralized.
  - Reject extra language-detection packages; supported locales are only `en`, `pt-BR`, and `es`, so a small resolver is clearer and easier to test.
  - Reject persisting raw `Set` instances; store serializable arrays/object DTOs and hydrate back into `Set`s in services for predictable IndexedDB behavior and simpler tests.
  - Treat “safe fallback mode” as an explicit safe failure/recovery mode, not silent in-memory continuation, because durable persistence is a confirmed product requirement for this epic.
- Components to be modified/created:
  - `package.json` — add `idb`, `i18next`, `react-i18next`.
  - `src/lib/storage/app_storage.ts` — typed IndexedDB adapter, database schema, read/write/reset helpers, failure classification.
  - `src/services/collection_service.ts` — persistence-backed collection state load/toggle/save helpers.
  - `src/services/locale_service.ts` — saved locale read/write helpers plus supported-locale resolution.
  - `src/providers/app_state_provider.tsx` — bootstrap gate and React context for storage/i18n-backed state.
  - `src/i18n/config.ts` — i18n singleton initialization and language switching entry point.
  - `src/locales/en/translation.json` — English base resources.
  - `src/locales/pt-BR/translation.json` — Brazilian Portuguese resources.
  - `src/locales/es/translation.json` — Spanish resources.
  - `src/routes/__root.tsx` — wrap app with bootstrap/provider and keep root HTML locale synchronized.
  - `src/routes/index.tsx` — replace starter copy with minimal translatable foundation screen plus visible locale switching surface for QA/user review.
  - `test/storage/app_storage.browser.test.ts` — browser-mode IndexedDB adapter coverage.
  - `test/services/collection_service.test.ts` — collection serialization/toggle/default-state coverage.
  - `test/services/locale_service.test.ts` — locale resolution/persistence coverage.
  - `test/i18n/translation_resources.test.ts` — locale key parity and resolver behavior coverage.
  - `e2e/locale-persistence.test.ts` — reload-persistence user-flow coverage for locale switching.
  - `docs/plan/Plan STR-3 EP3: Local Persistence + Internationalization Foundation.md` — this plan.

## Implementation Steps

1. Lock epic contract and edge-case rules before code changes.
   - Freeze required sequence: `STR-7` complete and validated before `STR-8`; `STR-8` complete and validated before `STR-9`.
   - Resolve doc conflict explicitly in implementation notes: confirmed user decision supersedes PRD storage fallback toast; storage failure blocks app instead of continuing in memory.
   - Keep browser-only APIs (`indexedDB`, `navigator`, `document`) out of module scope so TanStack Start hydration/build stays safe.
   - Assumption to carry forward: locale detection uses saved IndexedDB preference first, then `navigator.languages` best match when present, then `navigator.language`, then `en`.
2. Execute STR-7 by creating one minimal IndexedDB adapter and schema.
   - Add `idb` dependency in `package.json`.
   - Create `src/lib/storage/app_storage.ts` with one database name/version and one small key-value object store keyed by stable records such as `collection` and `locale`.
   - Expose typed methods for `initializeStorage`, `read`, `write`, and `resetAllData`, and return explicit result states such as `ready`, `unavailable`, and `unrecoverable` instead of scattering thrown errors through the UI.
   - Persist collection as plain serializable arrays/records, not `Set`s, so IndexedDB payloads stay deterministic.
   - Rollback/mitigation: if one generic adapter file becomes noisy, split types/helpers only; do not introduce repository classes or multi-layer storage abstractions.
3. Validate STR-7 adapter behavior before moving on.
   - Add `test/storage/app_storage.browser.test.ts` for happy-path open/read/write, first-run empty state, reset/delete flow, and mocked init/transaction failure paths.
   - Classify repeated open/read failures as unrecoverable for UX purposes even if browser error names vary; UI copy should say storage may be corrupted and resetting local data will erase progress.
   - Check that adapter failure results are stable enough for higher layers to branch on without parsing browser-specific exception strings.
4. Execute STR-8 by adding collection and locale services on top of the adapter.
   - Create `src/services/collection_service.ts` with helpers to load empty-first state, hydrate persisted arrays into `Set`-backed `CollectionState`, toggle sticker collected/missing state, and write immediately after each change.
   - Create `src/services/locale_service.ts` with helpers to load saved locale, save supported locale, and resolve a supported locale from persisted value or browser preferences.
   - Keep services thin and pure where possible: data shaping and locale matching stay here, while raw IndexedDB access stays inside the adapter.
   - Rollback/mitigation: if write-after-toggle flow risks divergent in-memory vs durable state, prefer “persist first, then commit React state” or revert local mutation on failure; do not silently keep unsaved UI state.
5. Validate STR-8 service behavior and wire bootstrap state.
   - Add `test/services/collection_service.test.ts` for default empty state, toggle cycle, array↔`Set` hydration, duplicate-toggle idempotency, and persisted round-trip coverage.
   - Add `test/services/locale_service.test.ts` for saved preference round-trip, exact locale match (`pt-BR`), language-only match (`pt-*` → `pt-BR`, `es-*` → `es`), and `en` fallback.
   - Create `src/providers/app_state_provider.tsx` to run startup bootstrap in order: initialize storage → load saved locale → resolve active locale → initialize i18n → load collection state.
   - Provider must expose three explicit render states to the app shell: `loading`, `ready`, and `storage-error`.
6. Execute STR-9 by configuring `react-i18next` and bundled locale resources.
   - Add `i18next` and `react-i18next` dependencies in `package.json`.
   - Create `src/i18n/config.ts` with a singleton `i18n` instance initialized exactly once from the bootstrap-resolved locale; later locale switches must call `changeLanguage` and persist via `locale_service`.
   - Create `src/locales/en/translation.json`, `src/locales/pt-BR/translation.json`, and `src/locales/es/translation.json` with identical key trees.
   - Include at minimum keys for current foundation UI copy, storage loading/error/reset messages, locale switch labels, team names (`team.*`), special page titles (`special.*`), group labels, and `scanner` scaffold namespace so later tasks do not need structural translation churn.
   - Rollback/mitigation: if async i18n init causes double-render or language flicker, move all initial language selection into bootstrap before first app render instead of initializing with `en` and immediately switching.
7. Wire STR-9 into the visible app shell for QA and future features.
   - Update `src/routes/__root.tsx` to wrap children with `AppStateProvider` and synchronize `<html lang>` with resolved locale once ready.
   - Update `src/routes/index.tsx` to replace starter placeholder copy with a minimal translated screen that proves locale switching works and gives QA a visible success path without building the later album viewer early.
   - On storage failure, render blocking translated error state; when failure is unrecoverable, include explicit destructive reset action that calls adapter reset, warns data loss, and retries bootstrap.
   - Keep UI surface intentionally small and semantic; if styling is required, use colocated CSS Modules and token-backed custom properties rather than ad-hoc inline values.
8. Run epic-level verification in the same strict order.
   - After STR-7: run browser tests for adapter only.
   - After STR-8: run service/unit tests plus bootstrap-state verification.
   - After STR-9: run `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, then `pnpm complete-check` for QA gate.
   - Verify locale persists across reload in Playwright, translation files stay structurally aligned in unit tests, and storage reset flow recovers from simulated unrecoverable state.
   - Rollback/mitigation: if route-level QA surface introduces churn, keep service/adapter/i18n work intact and temporarily simplify `index.tsx` while preserving provider/bootstrap wiring.

## Validation

- Success criteria:
  - STR-7: typed IndexedDB adapter exists, stores collection/locale records, returns explicit failure modes, and supports destructive reset for unrecoverable storage.
  - STR-8: collection and locale services provide persistence-backed read/write APIs, empty first-launch defaults, immediate write-on-change behavior, and safe bootstrap state handling.
  - STR-9: `react-i18next` is configured with bundled `en`, `pt-BR`, and `es` resources; locale detection honors saved preference before browser language and falls back to `en`; visible app copy can switch locale and persist after reload.
  - Repo-level: no coverage-threshold changes, no new overbuilt state library, and QA gate command `pnpm complete-check` passes.
- Checkpoints:
  - Pre-implementation: document the storage-failure policy override and locale-detection precedence so STR-7 implementation does not drift back to silent in-memory fallback.
  - After STR-7: browser tests prove happy path, reset path, and failure classification before any service code is added.
  - After STR-8: unit tests prove collection round-trip, locale round-trip, immediate persistence semantics, and provider bootstrap states (`loading` / `ready` / `storage-error`).
  - After STR-9: translation resource parity test passes, Playwright confirms locale switch + reload persistence, and root HTML locale updates with active language.
  - Final: `STR-7 → STR-8 → STR-9` completion order is preserved in commit/test flow, all acceptance criteria are satisfied, QA Control Gate passes, and implementation is ready for user review.

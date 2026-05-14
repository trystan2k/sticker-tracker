## Task Analysis

- Main objective:
  - Build EP6 share/export flow for missing stickers as a full-page route pair: selection (S4a) and preview/export (S4b).
  - Support 2 entry points without changing collection persistence or album routing contracts:
    - Drawer menu global share → open share selection with every page that still has missing stickers pre-selected.
    - Album viewer filter-row share icon → open share selection with the current page pre-selected.
  - Keep output client-only: generate PNG locally, then share with Web Share API when supported or download as fallback.
- Identified dependencies:
  - Canonical album order and page metadata already live in `src/data/album.ts`; share ordering must derive from `albumPages` only.
  - Missing/collected truth already lives in `src/services/collection-service.ts` and `src/providers/AppStateProvider.tsx`; no new store or persistence key should be introduced.
  - Existing album helpers already cover route and ordering concerns:
    - `src/components/album-viewer/viewer-state.ts` → `PAGE_SECTION_RUNS`, `getAlbumPath()`, `getAlbumPageByRoute()`, filter patterns.
    - `src/components/home/home-state.ts` shows current repo pattern for pure state derivation modules colocated with UI features.
  - Existing UI entry surfaces are already in place and should be extended, not replaced:
    - `src/components/MenuDrawer.tsx`
    - `src/components/home/HomeScreen.tsx`
    - `src/components/album-viewer/AlbumRouteScreen.tsx`
    - `src/components/album-viewer/AlbumViewer.tsx`
    - `src/components/album-viewer/AlbumPageHeader.tsx`
  - Current route structure uses TanStack file routes with generated `src/routeTree.gen.ts`; share routes must follow same pattern as `src/routes/album.tsx` + child route files.
  - Current repo has no URL-search helpers, no Web Share usage, and no canvas/image dependency. Share flow must therefore use custom light-weight helpers and browser APIs only.
  - Pencil design audit shows S4a and S4b use existing surface/header/action tokens for most chrome, but the preview card uses strict dark-green colors that are not fully exposed by current semantic tokens. Token gap must be checked before preview styling.
  - i18n contract remains strict: all new labels, empty states, errors, button copy, card copy, and badges must be added to all 3 locales.
- System impact:
  - New feature slice under `src/components/share/` plus 2 new top-level routes: `/share` and `/share/preview`.
  - Share selection should be URL-backed, not provider-backed, so back/refresh/preview stay stable without hidden memory.
  - Preview generation introduces browser-only PNG rendering and share/download UX, but collection schema, storage, and album route validation remain unchanged.
  - Entry-point work is shallow but cross-cutting: home drawer, album drawer, album filter row, route tree, translations, token output, browser tests, and E2E coverage all move together.

## Chosen Approach

- Proposed solution:
  - Use a dedicated pure helper module `src/components/share/share-state.ts` as the feature source of truth.
    - Core route contract:
      - `pages` search param = canonical comma-separated selected PageIds in album order.
      - `from` search param = sanitized in-app fallback path used only when selection screen cannot go back in history.
    - Core types/signatures:
      - `export type ShareEntryPoint = Readonly<{ type: 'all-missing' } | { type: 'current-page'; pageId: PageId }>;`
      - `export type ShareRouteSearch = Readonly<{ pages?: string; from?: string }>;`
      - `export type ShareSelectionSection = Readonly<{ sectionId: string; rows: readonly ShareSelectionRow[] }>;`
      - `export type SharePreviewPayload = Readonly<{ selectedPageIds: readonly PageId[]; selectedPageCount: number; totalMissingStickerCount: number; sections: readonly SharePreviewSection[] }>;`
      - `export function parseShareRouteSearch(raw: Record<string, unknown>): ShareRouteSearch;`
      - `export function buildInitialShareSelection(collection: CollectionState, entryPoint: ShareEntryPoint): readonly PageId[];`
      - `export function buildShareSelectionSections(collection: CollectionState): readonly ShareSelectionSection[];`
      - `export function buildSharePreviewPayload(collection: CollectionState, selectedPageIds: readonly PageId[]): SharePreviewPayload;`
      - `export function encodeShareSelection(pageIds: readonly PageId[]): string | undefined;`
      - `export function decodeShareSelection(rawValue: unknown): readonly PageId[];`
      - `export function compressMissingStickerIds(page: AlbumPage, stickerIds: readonly StickerIdentifier[]): readonly string[];`
  - Keep collection as the only persisted source. Entry points compute initial selected page ids before navigating. Both share screens rebuild their UI from `collection + search params`, never from hidden state.
  - Create new route pair under a standard TanStack parent route:
    - `src/routes/share.tsx` → parent Outlet
    - `src/routes/share/index.tsx` → selection screen
    - `src/routes/share/preview.tsx` → preview/share/download screen
  - Build preview from one shared render model so on-screen card and exported PNG never drift.
    - Suggested render contracts in `src/components/share/share-renderer.ts`:
      - `export type ShareRenderModel = Readonly<{ cardTitle: string; cardSubtitle: string; cardFooter: string; sections: readonly ShareRenderSection[] }>;`
      - `export type SharePngAsset = Readonly<{ blob: Blob; fileName: string; width: number; height: number; scale: number }>;`
      - `export async function renderSharePng(model: ShareRenderModel, options?: RenderSharePngOptions): Promise<SharePngAsset>;`
  - Keep PNG generation dependency-free and deterministic with a custom canvas renderer.
    - Layout uses per-page compressed missing-id text instead of rendering every sticker cell.
    - This matches the Pencil preview card structure and prevents full-album exports from exploding in height.
  - Reuse current repo patterns everywhere else:
    - CSS Modules for all new UI.
    - Existing flag-icon usage for selection rows.
    - Existing route/component split where route files stay thin and screen components own UI logic.
- Justification for simplicity:
  - Reject provider-level or persisted share draft state. Share selection is transient route state, not app-global data.
  - Reject module-level hidden share store. It would break refresh/direct preview access and create brittle back-navigation behavior.
  - Reject third-party DOM screenshot libs (html2canvas, dom-to-image, etc.). They add dependency weight, font/CSS drift risk, and are unnecessary for a single card-shaped export.
  - Reject sending sticker payload through the URL. Selected page ids are enough because the app already owns canonical album data and live collection state.
  - Reject per-sticker grid preview/export. Pencil S4b already uses grouped page blocks with text lists; that format is far more size-safe for 51 pages.
  - Reject changing CollectionState, storage schema, or AppStateProvider contract. EP6 is a derived-view/export feature, not a state-model rewrite.
- Components to be modified/created:
  - New routes:
    - `src/routes/share.tsx` — parent share route layout with Outlet.
    - `src/routes/share/index.tsx` — /share selection route.
    - `src/routes/share/preview.tsx` — /share/preview preview/export route.
  - New feature files:
    - `src/components/share/share-state.ts`
    - `src/components/share/share-renderer.ts`
    - `src/components/share/ShareSelectionScreen.tsx`
    - `src/components/share/ShareSelectionScreen.module.css`
    - `src/components/share/SharePreviewScreen.tsx`
    - `src/components/share/SharePreviewScreen.module.css`
    - `src/components/share/SharePreviewCard.tsx`
    - `src/components/share/SharePreviewCard.module.css`
  - Existing files to modify:
    - `src/components/MenuDrawer.tsx` — add optional `onOpenShare?: () => void`; enable row when handler exists.
    - `src/components/home/HomeScreen.tsx` — compute global share selection and navigate to /share.
    - `src/components/album-viewer/AlbumRouteScreen.tsx` — compute openGlobalShare() and openCurrentPageShare() from current collection/page.
    - `src/components/album-viewer/AlbumViewer.tsx` — add filter-row share icon button + callback prop.
    - `src/components/album-viewer/AlbumViewer.module.css` — layout for trailing share icon button.
    - `src/components/album-viewer/AlbumPageHeader.tsx` — pass global share callback into MenuDrawer.
    - `src/locales/en/translation.json`
    - `src/locales/pt-BR/translation.json`
    - `src/locales/es/translation.json`
    - `design-tokens/semantic/color.tokens.json` — only if strict preview-card colors cannot be mapped to existing semantic tokens cleanly.
    - `design-tokens/dist/semantic.css` — generated after token rebuild.
    - `src/routeTree.gen.ts` — generated after route additions.
  - New/updated tests:
    - `test/components/share/share-state.test.ts`
    - `test/components/share/share-renderer.browser.test.ts`
    - `test/components/share/ShareSelectionScreen.browser.test.tsx`
    - `test/components/share/SharePreviewScreen.browser.test.tsx`
    - `test/components/MenuDrawer.browser.test.tsx`
    - `test/components/album-viewer/AlbumViewer.browser.test.tsx`
    - `test/components/album-viewer/AlbumRouteScreen.browser.test.tsx`
    - `test/i18n/translation-resources.test.ts`
    - `e2e/share-selection.test.ts`
    - `e2e/share-preview.test.ts`

## Implementation Steps

1. Lock route, token, and payload contracts before UI work starts.
   - Add `src/routes/share.tsx` with the same parent-layout pattern already used by `src/routes/album.tsx`.
   - Create the share search contract in `src/components/share/share-state.ts`:
     - sanitize `from` to in-app paths only (`'/'` fallback)
     - sanitize `pages` by deduping, dropping invalid page ids, and reordering into canonical `albumPages` order
   - Audit preview-card Pencil colors against current semantic token output.
     - If current tokens are insufficient, add semantic tokens such as `surface.shareCard.bg`, `surface.shareCard.header`, `surface.shareCard.footer`, `color.text.shareCard.secondary`, and `color.border.shareCard.divider` in `design-tokens/semantic/color.tokens.json`, then regenerate CSS with `pnpm tokens:build`.
   - Route plan:
     - `/share` = selection/editing route.
     - `/share/preview` = derived preview/share/download route.
     - `src/routeTree.gen.ts` must be treated as generated output only.

2. Execute STR-23 by modeling selectable missing-page data as pure helpers.
   - In `src/components/share/share-state.ts`, implement page-derived helpers only; no React, no storage writes.
   - Exact data-flow rules:
     - selectable rows = only pages with `missingCount > 0`
     - global drawer preset = every selectable page id
     - album share-icon preset = current page id only if it still has missing stickers; otherwise empty selection
     - selected ids stored in URL always remain album-ordered, even if the user toggles out of order
   - Add helper output for both screen types:
     - `buildShareSelectionSections()` for S4a checkbox rows grouped in album order
     - `buildSharePreviewPayload()` for S4b grouped page blocks and totals
     - `compressMissingStickerIds()` to turn long page-level sticker lists into compact readable ranges/text tokens suitable for preview and PNG render
   - Keep route payload compact by deriving everything from `CollectionState` instead of serializing missing stickers into search params.
   - Checkpoint: pure tests pass before any route/component wiring begins.

3. Finish STR-23 by wiring the selection route, selection screen, and both entry points.
   - Route files:
     - `src/routes/share/index.tsx` — validates search, renders ShareSelectionScreen
     - `src/routes/share/preview.tsx` — reuses same search parser
   - Entry-point callbacks:
     - MenuDrawer gets optional `onOpenShare` prop.
     - HomeScreen adds global share callback: derive with `buildInitialShareSelection(collection, { type: 'all-missing' })`, navigate to `/share` with `{ pages, from: '/' }`.
     - AlbumRouteScreen adds two callbacks: openGlobalShare() and openCurrentPageShare().
     - AlbumPageHeader passes onOpenShare into MenuDrawer.
     - AlbumViewer gets onOpenCurrentPageShare prop and renders share icon button in filter row.
   - ShareSelectionScreen component tree: header (back + title + badge), quick actions (select all | clear | count), scrollable checkbox list, footer CTA "Generate Image".
   - Selection-state flow: row toggle/select-all/clear updates route search, CTA navigates to `/share/preview`.
   - Browser tests for selection screen, MenuDrawer, AlbumViewer share button.

4. Build STR-24 preview data presentation before exporting PNG.
   - Create `src/components/share/SharePreviewCard.tsx` to render grouped data (same structure PNG renderer will use).
   - Create `src/components/share/SharePreviewScreen.tsx` to own preview-route behavior.
   - Preview-route guard: if payload becomes empty, navigate back to `/share`.
   - SharePreviewScreen: header, preview area with SharePreviewCard, action bar (share + download buttons).
   - Keep one shared render model between on-screen card and PNG.
   - Checkpoint: browser review against S4b passes before renderer wiring.

5. Execute STR-24 by implementing deterministic PNG rendering with explicit size safeguards.
   - In `src/components/share/share-renderer.ts`, implement browser-only 2D canvas rendering.
   - Logical card width matches Pencil preview card (320).
   - Draw card header, page sections, footer in order.
   - Use compact per-page sticker text from `compressMissingStickerIds()`.
   - Explicit safeguards: clamp scale so final bitmap never exceeds max safe ceiling (MAX_EXPORT_WIDTH_PX=2048, MAX_EXPORT_HEIGHT_PX=8192). If scale drops below 1, throw controlled error.
   - Renderer browser tests: returns PNG blob, clamps scale, throws on empty payload.

6. Execute STR-25 by wiring share/download UX around cached generated asset.
   - Memoize render model and cache PNG generation promise so Share and Download don't regenerate.
   - handleShare(): generate asset, try Web Share API file share, fall back to download.
   - handleDownload(): create object URL, trigger anchor download, revoke URL.
   - Both buttons visible per Pencil. Disable while action is busy.
   - Add translation keys for all new text.
   - Browser tests for share fallback, download trigger, error states.

7. Close with regression, E2E, and repo-level verification.
   - E2E: share-selection and share-preview test files.
   - i18n regression: extend translation-resources test.
   - Generated artifacts: pnpm tokens:build, route tree regeneration, pnpm typecheck, pnpm test, pnpm test:e2e, pnpm complete-check.

## Validation

- Success criteria:
  - Routes: /share renders S4a selection, /share/preview renders S4b preview/export.
  - Entry points: drawer share opens with all-missing preselected, album filter-row opens with current page preselected.
  - Data flow: selection fully reconstructable from `pages` search param, survives refresh/back/preview.
  - UI matches Pencil designs: S4a and S4b structures.
  - PNG generation succeeds within safety limits, Web Share file path used when available, download fallback otherwise.
  - All new strings use i18n keys in en/pt-BR/es.
  - pnpm complete-check passes.

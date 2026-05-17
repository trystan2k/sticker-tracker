## Task Analysis

- Main objective:
  - Deliver Linear epic `STR-67` "EP14: Backup / Restore" with a safe client-only export/import flow for collection data only.
  - Preserve existing app constraints: offline-first, IndexedDB-backed, no backend, no cloud sync, no locale/theme/preferences inside backup files.
  - Ship in dependency order already provided by task intake: `STR-68` backup export, `STR-69` valid restore, `STR-70` validation hardening + regression coverage.
- Identified dependencies:
  - Canonical collection model and persistence already exist:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/services/collection-service.ts`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/lib/storage/app-storage.ts`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`
  - Canonical album validation source already exists and must stay single source of truth:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/data/album.ts`
  - Existing UI patterns to reuse instead of inventing new surfaces:
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/ThemeSheet.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/ThemeSheet.module.css`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.module.css`
    - `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/share/SharePreviewScreen.tsx` for inline status + download fallback pattern.
  - Existing test and E2E conventions to reuse:
    - Vitest service tests in `test/services/*.test.ts`
    - browser component tests in `test/components/**/*.browser.test.tsx`
    - Playwright files use `e2e/*.test.ts`, not `*.spec.ts`
  - Translation alignment already enforced by `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/i18n/translation-resources.test.ts`; new keys must be added to all 3 locale JSON files in one pass.
  - Plan file: `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-67 EP14: Backup ／ Restore.md`.
- System impact:
  - UI: MenuDrawer gains a new `drawer.backup_restore` row; Home, Album, and Not Found gain a new bottom sheet surface matching ThemeSheet interaction rules.
  - Services: new `backup-service.ts` owns schema creation, file IO, parse/validate, and picker/download fallbacks.
  - State: `AppStateProvider` needs one restore-specific action so imported collection can update IndexedDB and live React state without full page reload.
  - Data integrity: restore must validate schema version, page ids, sticker ids, and duplicate/impossible data before any storage mutation.
  - QA: browser and Playwright coverage must expand for export, restore, picker cancellation, confirm overwrite, and invalid-file rejection.

## Chosen Approach

- Proposed solution:
  - Use one feature slice with clear boundaries:
    - `src/services/backup-service.ts` handles backup schema, JSON serialization, browser file APIs, restore file reading, and strict validation.
    - `src/services/collection-service.ts` gains one explicit replace/restore write path beside the existing toggle path.
    - `src/providers/AppStateProvider.tsx` exposes `restoreCollection(...)` so IndexedDB write + in-memory state update stay centralized.
    - `src/components/BackupRestoreSheet.tsx` owns user actions, `t()` lookups, confirm flow, and inline status rendering.
  - Keep backup-service non-UI and non-i18n-aware.
    - Service returns typed success/error/cancel results.
    - Sheet maps those results to translated inline status strings with `t()`.
  - Reuse existing repo contracts exactly where they already fit:
    - ThemeSheet portal/backdrop/Escape/close-button structure.
    - MenuDrawer optional callback row pattern.
    - SharePreviewScreen object-URL download fallback pattern.
    - `albumPages` as sole validation source.
- Justification for simplicity:
  - Reject direct IndexedDB writes from `BackupRestoreSheet`. That would duplicate provider error handling and make live React state sync fragile.
  - Reject a new settings route or global preferences page. One drawer row + one sheet matches current app architecture and user request.
  - Reject putting translated strings inside `backup-service.ts`. Existing repo pattern keeps status rendering inside components; that makes service tests pure and avoids hidden i18n coupling.
  - Reject exporting locale/theme/reset metadata. Epic scope is collection migration only.
  - Reject broad storage schema changes. Existing `collection` key remains unchanged; backup format lives outside IndexedDB.
- Components to be modified/created:
  - Core implementation files:
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/services/backup-service.ts`
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/BackupRestoreSheet.tsx`
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/BackupRestoreSheet.module.css`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/services/collection-service.ts`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/providers/AppStateProvider.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/MenuDrawer.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/home/HomeScreen.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/album-viewer/AlbumPageHeader.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/components/not-found/NotFoundPage.tsx`
  - Locale files:
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/en/translation.json`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/es/translation.json`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/src/locales/pt-BR/translation.json`
  - Test files:
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/services/backup-service.test.ts`
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/BackupRestoreSheet.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/MenuDrawer.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/providers/AppStateProvider.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/home/HomeScreen.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/album-viewer/AlbumPageHeader.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/not-found/NotFoundPage.browser.test.tsx`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/test/components/scanner/ScannerScreen.browser.test.tsx` only if the added provider method breaks the explicit `mockAppState` shape.
    - Create `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/backup-restore.test.ts`
    - Modify `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/e2e/home-menu-drawer.test.ts`
  - Exact translation keys to add:
    - English:
      ```json
      {
        "drawer": {
          "backup_restore": "Backup & Restore"
        },
        "backupRestore": {
          "sheetTitle": "Backup & Restore",
          "close": "Close",
          "backup": "Export backup",
          "restore": "Restore backup",
          "idle": "Export your collection to a file or restore it from a previous backup.",
          "exporting": "Preparing backup...",
          "exportSuccess": "Backup exported successfully.",
          "restoring": "Restoring backup...",
          "restoreSuccess": "Backup restored successfully.",
          "confirmTitle": "Replace current collection",
          "confirmBody": "Your current collected stickers will be replaced by the imported backup. This action cannot be undone.",
          "downloadError": "Could not export backup. Try again.",
          "readError": "Could not read the selected file.",
          "invalidJson": "Selected file is not valid JSON.",
          "invalidSchema": "Selected file is not a valid Sticker Tracker backup.",
          "unsupportedVersion": "Backup version is not supported.",
          "missingCollection": "Backup file does not contain collection data.",
          "invalidCollection": "Backup collection format is invalid.",
          "invalidPageId": "Backup contains an unknown page: {{pageId}}.",
          "invalidStickerId": "Backup contains an invalid sticker {{stickerId}} on page {{pageId}}.",
          "duplicateStickerId": "Backup contains duplicate stickers on page {{pageId}}.",
          "restoreWriteError": "Could not restore backup. Try again."
        }
      }
      ```
    - Spanish:
      ```json
      {
        "drawer": {
          "backup_restore": "Respaldo y restauración"
        },
        "backupRestore": {
          "sheetTitle": "Respaldo y restauración",
          "close": "Cerrar",
          "backup": "Exportar respaldo",
          "restore": "Restaurar respaldo",
          "idle": "Exporta tu colección a un archivo o restáurala desde un respaldo anterior.",
          "exporting": "Preparando respaldo...",
          "exportSuccess": "Respaldo exportado correctamente.",
          "restoring": "Restaurando respaldo...",
          "restoreSuccess": "Respaldo restaurado correctamente.",
          "confirmTitle": "Reemplazar colección actual",
          "confirmBody": "Tus figuritas marcadas actualmente serán reemplazadas por el respaldo importado. Esta acción no se puede deshacer.",
          "downloadError": "No se pudo exportar el respaldo. Intenta de nuevo.",
          "readError": "No se pudo leer el archivo seleccionado.",
          "invalidJson": "El archivo seleccionado no es un JSON válido.",
          "invalidSchema": "El archivo seleccionado no es un respaldo válido de Sticker Tracker.",
          "unsupportedVersion": "La versión del respaldo no es compatible.",
          "missingCollection": "El archivo de respaldo no contiene datos de colección.",
          "invalidCollection": "El formato de la colección del respaldo es inválido.",
          "invalidPageId": "El respaldo contiene una página desconocida: {{pageId}}.",
          "invalidStickerId": "El respaldo contiene una figurita inválida {{stickerId}} en la página {{pageId}}.",
          "duplicateStickerId": "El respaldo contiene figuritas duplicadas en la página {{pageId}}.",
          "restoreWriteError": "No se pudo restaurar el respaldo. Intenta de nuevo."
        }
      }
      ```
    - Portuguese (Brazil):
      ```json
      {
        "drawer": {
          "backup_restore": "Backup e restauração"
        },
        "backupRestore": {
          "sheetTitle": "Backup e restauração",
          "close": "Fechar",
          "backup": "Exportar backup",
          "restore": "Restaurar backup",
          "idle": "Exporte sua coleção para um arquivo ou restaure a partir de um backup anterior.",
          "exporting": "Preparando backup...",
          "exportSuccess": "Backup exportado com sucesso.",
          "restoring": "Restaurando backup...",
          "restoreSuccess": "Backup restaurado com sucesso.",
          "confirmTitle": "Substituir coleção atual",
          "confirmBody": "Suas figurinhas marcadas atualmente serão substituídas pelo backup importado. Esta ação não pode ser desfeita.",
          "downloadError": "Não foi possível exportar o backup. Tente novamente.",
          "readError": "Não foi possível ler o arquivo selecionado.",
          "invalidJson": "O arquivo selecionado não contém um JSON válido.",
          "invalidSchema": "O arquivo selecionado não é um backup válido do Sticker Tracker.",
          "unsupportedVersion": "A versão do backup não é compatível.",
          "missingCollection": "O arquivo de backup não contém dados da coleção.",
          "invalidCollection": "O formato da coleção no backup é inválido.",
          "invalidPageId": "O backup contém uma página desconhecida: {{pageId}}.",
          "invalidStickerId": "O backup contém uma figurinha inválida {{stickerId}} na página {{pageId}}.",
          "duplicateStickerId": "O backup contém figurinhas duplicadas na página {{pageId}}.",
          "restoreWriteError": "Não foi possível restaurar o backup. Tente novamente."
        }
      }
      ```

## Implementation Steps

1. Lock contracts before coding `STR-68`.
   - Confirm 4 implementation rules and keep them fixed through the epic:
     - backup file contains `collection` data only;
     - exported schema is versioned JSON, not a raw IndexedDB dump;
     - restore never mutates storage until parsing + validation + optional overwrite confirm all succeed;
     - sheet status strings come from `t()` in the component, not from the service.
   - Normalize 2 repo-specific naming deviations up front:
     - use `e2e/backup-restore.test.ts` instead of requested `*.spec.ts` to match repo convention;
     - use plan path `Backup ／ Restore.md` because filesystem path cannot contain `/`.
   - Key implementation details:
     - backup schema constant: `const BACKUP_SCHEMA_VERSION = 1 as const`
     - payload type:
       `type BackupPayload = Readonly<{ version: 1; exportedAt: string; appVersion: string; collection: PersistedCollection }>`
     - module-scope validation maps in `backup-service.ts`:
       - `const pageById = new Map(albumPages.map((page) => [page.pageId, page]))`
       - `const stickerIdsByPage = new Map(albumPages.map((page) => [page.pageId, new Set(page.stickerIds)]))`
   - Checkpoint:
     - No new storage keys required.
     - No route changes required.
   - Risk / mitigation:
     - If DOM typings for File System Access API are missing, add narrow local types inside `backup-service.ts`; avoid a global `*.d.ts` unless absolutely necessary.

2. Implement `STR-68` shell work: translations, drawer row, and sheet scaffold.
   - Files:
     - `src/locales/en/translation.json`
     - `src/locales/es/translation.json`
     - `src/locales/pt-BR/translation.json`
     - `src/components/MenuDrawer.tsx`
     - `src/components/BackupRestoreSheet.tsx`
     - `src/components/BackupRestoreSheet.module.css`
     - `src/components/home/HomeScreen.tsx`
     - `src/components/album-viewer/AlbumPageHeader.tsx`
     - `src/components/not-found/NotFoundPage.tsx`
   - Add `MenuDrawerProps` callback:
     - `onOpenBackupRestore?: (() => void) | undefined;`
   - Add drawer handler in `MenuDrawer.tsx`:
     - `const handleOpenBackupRestore = useCallback(() => { ... }, [onClose, onOpenBackupRestore]);`
   - Row placement rule:
     - insert the new row immediately after Theme row;
     - keep optional install row below it;
     - keep Delete row last.
   - `BackupRestoreSheet.tsx` should mirror `ThemeSheet.tsx` structure:
     - `isOpen`, `onClose`, `collection`, `onRestoreCollection`
     - portal mount to `document.body`
     - overlay + backdrop button + sheet + handle + header + close button
     - Escape key closes
     - backdrop click closes
     - actions area with two buttons using `lucide-react` icons: `Download`, `Upload`
     - persistent status area, e.g. `<p role="status" aria-live="polite" aria-atomic="true">...`
   - Styling rules for `BackupRestoreSheet.module.css`:
     - copy ThemeSheet token structure first, then adjust only where content needs more height;
     - use token-backed surfaces, borders, spacing, typography, and icon sizes only;
     - keep one-column action list, no custom animation system.
   - Screen wiring pattern in Home, Album, Not Found:
     - add `isBackupRestoreSheetOpen` state
     - add `handleOpenBackupRestoreSheet()` / `handleCloseBackupRestoreSheet()`
     - pass `onOpenBackupRestore={handleOpenBackupRestoreSheet}` into `MenuDrawer`
     - mount `<BackupRestoreSheet ... />` beside `<ThemeSheet ... />`
   - Checkpoint:
     - Drawer row visible from all three entry points.
     - Sheet opens/closes with same interaction contract as ThemeSheet.
   - Risk / mitigation:
     - If sheet content height clips on smaller devices, increase sheet height with existing token math only; do not introduce internal scrolling unless action/status content actually overflows.

3. Implement `STR-68` backup export flow in `src/services/backup-service.ts`.
   - Functions to add:
     - `export function generateBackupPayload(collection: CollectionState): BackupPayload`
     - `export async function triggerBackupDownload(payload: BackupPayload): Promise<BackupDownloadResult>`
     - internal helpers:
       - `function buildBackupFileName(exportedAt: string): string`
       - `function serializeBackupPayload(payload: BackupPayload): string`
       - `async function saveWithFileSystemAccess(fileName: string, contents: string): Promise<'saved' | 'cancelled'>`
       - `function downloadWithAnchor(fileName: string, contents: string): void`
   - Implementation details:
     - `generateBackupPayload()` uses `serializeCollectionState(collection)` and `APP_VERSION` from `src/version.ts`.
     - `exportedAt` must be `new Date().toISOString()`.
     - `serializeBackupPayload()` uses `JSON.stringify(payload, null, 2)` for readable restore/debug output.
     - `buildBackupFileName()` should use a filesystem-safe timestamp, e.g. `sticker-tracker-backup-2026-05-17T12-30-45.json`.
     - `triggerBackupDownload()` flow:
       1. serialize payload;
       2. if `window.showSaveFilePicker` exists, call it with JSON MIME + suggested name;
       3. on success, write text via writable stream;
       4. on `AbortError`, return cancelled;
       5. if API unsupported, fallback to anchor download using `Blob`, `URL.createObjectURL`, `link.download`, and `URL.revokeObjectURL`.
   - `BackupRestoreSheet.tsx` backup action:
     - `handleBackup()` sets status to `t('backupRestore.exporting')`
     - calls `generateBackupPayload(collection)` + `triggerBackupDownload(payload)`
     - maps result to:
       - success -> `t('backupRestore.exportSuccess')`
       - cancelled -> keep previous/idle status, no error noise
       - error -> `t('backupRestore.downloadError')`
   - Checkpoint:
     - Exported JSON includes exactly `version`, `exportedAt`, `appVersion`, `collection`.
     - Export does not touch IndexedDB.
   - Risk / mitigation:
     - If save picker path proves flaky in tests, keep it in service but drive automated E2E through the download fallback by stubbing picker absence.

4. Implement provider-owned restore write path before wiring file import.
   - Files:
     - `src/services/collection-service.ts`
     - `src/providers/AppStateProvider.tsx`
     - `test/providers/AppStateProvider.browser.test.tsx`
   - Add collection-service API:
     - `export type ReplaceCollectionResult = { state: 'ready'; value: CollectionState } | { state: Exclude<StorageState, 'ready'> };`
     - `export async function replacePersistedCollection(persistedCollection: PersistedCollection): Promise<ReplaceCollectionResult>`
   - `replacePersistedCollection()` behavior:
     - write raw persisted collection into `write('collection', persistedCollection)`;
     - on success, return hydrated Set-backed state via `hydrateCollectionState(persistedCollection)`;
     - on failure, return non-ready state and do not mutate caller state.
   - Add provider method:
     - `restoreCollection: (persistedCollection: PersistedCollection) => Promise<ReplaceCollectionResult>`
   - Provider behavior should follow scanner save-failure pattern, not toggle-failure pattern:
     - success -> `setCollection(result.value)`
     - failure -> return failure without switching whole app into `storage-error`
   - Reason:
     - restore UX needs inline sheet error feedback and should not collapse immediately into global storage-error UI for one import failure.
   - Also update context type and any strict mock objects.
   - Checkpoint:
     - Provider can replace collection in memory + IndexedDB without page reload.
     - Failed restore write keeps `renderState === 'ready'`.
   - Risk / mitigation:
     - If TypeScript breaks explicit context mocks, patch only files with strongly typed object literals first; do not rewrite all tests that already use `as unknown as ...` casts.

5. Implement `STR-69` valid restore flow end-to-end.
   - Files:
     - `src/services/backup-service.ts`
     - `src/components/BackupRestoreSheet.tsx`
     - `src/components/home/HomeScreen.tsx`
     - `src/components/album-viewer/AlbumPageHeader.tsx`
     - `src/components/not-found/NotFoundPage.tsx`
   - Functions to add in `backup-service.ts`:
     - `export async function triggerRestore(): Promise<BackupRestoreReadResult>`
     - `export function validateBackupPayload(value: unknown): BackupValidationResult`
     - `export function parseBackupJson(rawText: string): BackupParseResult`
     - internal helpers:
       - `async function openBackupFile(): Promise<File | null>`
       - `async function openWithFileSystemAccess(): Promise<File | null>`
       - `async function openWithFileInput(): Promise<File | null>`
   - Restore happy-path order inside `BackupRestoreSheet.tsx`:
     1. set status `t('backupRestore.restoring')`
     2. call `triggerRestore()`
     3. if cancelled, reset back to idle or preserve previous success state
     4. if error, map error code to translated message
     5. if parsed payload is valid and current collection is non-empty, ask confirm with:
        - `window.confirm(`${t('backupRestore.confirmTitle')}\n\n${t('backupRestore.confirmBody')}`)`
     6. if confirm rejected, keep collection untouched and restore idle status
     7. call `await onRestoreCollection(payload.collection)`
     8. on provider success, show `t('backupRestore.restoreSuccess')`
   - `onRestoreCollection` wiring in screens:
     - pass `onRestoreCollection={appState.restoreCollection}` into `BackupRestoreSheet`
     - pass current `collection={appState.collection}` into `BackupRestoreSheet`
   - File input fallback details:
     - `accept=".json,application/json"`
     - remove DOM node after resolve/reject
     - support cancellation with `cancel` listener when available plus one focus-based fallback so promise does not hang after chooser close.
   - Checkpoint:
     - Restoring a valid exported backup updates visible sticker state immediately.
     - No full reload needed.
   - Risk / mitigation:
     - If fallback cancellation detection is inconsistent across browsers, keep `showOpenFilePicker` primary path and cover fallback using controlled browser tests with explicit file chooser handling.

6. Implement `STR-70` strict validation and no-mutation guarantees.
   - Validation rules in `backup-service.ts`:
     - raw text must parse with `JSON.parse`
     - root must be non-null object
     - `version === BACKUP_SCHEMA_VERSION`
     - `exportedAt` must be a string with valid `Date.parse(...)`
     - `appVersion` must be a non-empty string
     - `collection` must be a plain record object
     - every page id must exist in `albumPages`
     - every page value must be an array of strings
     - every sticker id must belong to that page's `stickerIds`
     - duplicate sticker ids inside one page array should be rejected, not silently deduped
     - empty collection object `{}` is valid
   - Suggested result shape:
     - `type BackupErrorCode = 'cancelled' | 'read-error' | 'invalid-json' | 'invalid-schema' | 'unsupported-version' | 'missing-collection' | 'invalid-collection' | 'invalid-page-id' | 'invalid-sticker-id' | 'duplicate-sticker-id'`
     - attach metadata for interpolation when needed:
       - `{ pageId }`
       - `{ pageId, stickerId }`
   - No-mutation guarantee:
     - `triggerRestore()` only returns parsed payload;
     - provider write is called only after validation + optional confirm;
     - invalid/cancelled files never call `restoreCollection()`.
   - Checkpoint:
     - Unknown page id like `foo` rejected.
     - Wrong sticker like `BRA-99` on page `bra` rejected.
     - Duplicate sticker arrays rejected.
     - IndexedDB remains unchanged for every invalid-file test.
   - Risk / mitigation:
     - If validation helper grows too large, split pure helpers inside `backup-service.ts` first; avoid creating a second validation module unless file size becomes unmanageable.

7. Add automated coverage in repo-native layers.
   - `test/services/backup-service.test.ts`
     - `generateBackupPayload()` emits version/appVersion/exportedAt/serialized collection
     - `parseBackupJson()` rejects invalid JSON
     - `validateBackupPayload()` accepts valid empty + non-empty payloads
     - rejects wrong version
     - rejects missing collection
     - rejects non-array collection page values
     - rejects unknown page ids
     - rejects invalid sticker ids
     - rejects duplicate sticker ids
   - `test/components/BackupRestoreSheet.browser.test.tsx`
     - closed state renders nothing
     - open state renders dialog, buttons, status area
     - close button/backdrop/Escape close the sheet
     - backup success shows translated success status
     - restore success shows translated success status
     - restore invalid file shows translated validation status
     - restore with non-empty collection asks `window.confirm`
     - restore with empty collection skips confirm
     - cancelled picker does not show error noise or mutate collection
   - `test/components/MenuDrawer.browser.test.tsx`
     - new row visible when `onOpenBackupRestore` exists
     - row disabled when callback missing
     - clicking row calls callback
     - order assertion: Theme row index < Backup/Restore row index < Delete row index
   - `test/providers/AppStateProvider.browser.test.tsx`
     - `restoreCollection()` updates context collection on success
     - `restoreCollection()` returns storage failure and keeps `renderState` ready on failure
   - `test/components/home/HomeScreen.browser.test.tsx`, `test/components/album-viewer/AlbumPageHeader.browser.test.tsx`, `test/components/not-found/NotFoundPage.browser.test.tsx`
     - backup/restore row visible
     - sheet opens from drawer
     - provider callback wiring present
   - `test/components/scanner/ScannerScreen.browser.test.tsx`
     - only patch `mockAppState` if context typing requires the new `restoreCollection` method.
   - `e2e/home-menu-drawer.test.ts`
     - assert translated backup/restore row visible with existing drawer entries.
   - `e2e/backup-restore.test.ts`
     - export path: stub `showSaveFilePicker` unavailable, verify browser download occurs and exported JSON matches schema
     - restore path: stub `showOpenFilePicker` unavailable, use file chooser fallback, restore known collection, verify album UI updates after import
     - overwrite path: seed current collection, accept confirm, import different backup, verify old sticker state replaced
     - invalid file path: import malformed/invalid backup, verify visible error and no collection mutation
   - Checkpoint:
     - Coverage exists at pure service, browser component, provider, and Playwright user-flow layers.
   - Risk / mitigation:
     - If save/open picker APIs are hard to automate directly, stub them off in E2E and cover primary API presence in browser-level component/service stubs.

8. Run regression and repo QA in dependency order.
   - Focused validation order:
     1. `test/services/backup-service.test.ts`
     2. `test/components/BackupRestoreSheet.browser.test.tsx`
     3. updated drawer/provider/screen browser tests
     4. `e2e/home-menu-drawer.test.ts` + `e2e/backup-restore.test.ts`
     5. full repo QA: `pnpm complete-check`
   - Regression areas to watch:
     - share row enable/disable behavior still works
     - ThemeSheet and LocaleSwitcher still open/close correctly
     - PWA install row still appears only when supported
     - delete data flow still last in drawer and still works
     - album toggle persistence still unchanged after restore feature lands
   - Final implementation note:
     - do not change `PersistedCollection` shape, `CollectionState` shape, or coverage thresholds.

## Validation

- Success criteria:
  - Plan file exists at `/Users/trystan2k/Documents/Thiago/Repos/sticker-tracker/docs/plan/Plan STR-67 EP14: Backup ／ Restore.md`.
  - `STR-68` is complete when users can open a new Backup & Restore sheet from Home, Album, and Not Found, then export a versioned JSON backup of collection data only through save-picker or download fallback.
  - `STR-69` is complete when users can import a valid backup file, optionally confirm overwrite when collection is non-empty, persist the imported collection to IndexedDB, and see live UI state update without reloading.
  - `STR-70` is complete when malformed or incompatible backups are rejected with translated inline status, no collection mutation happens on failure/cancel, and regression coverage exists for export, restore, and validation edge cases.
  - `pnpm complete-check` passes on branch `feature/STR-67-backup-restore`.
- Checkpoints:
  - Pre-implementation assumptions check:
    - Confirm backup scope stays collection-only.
    - Confirm provider owns restore mutation path.
    - Confirm service returns semantic result codes and sheet owns `t()` status mapping.
  - During-implementation correctness checks:
    - After Step 2, drawer row opens the new sheet from all three surfaces and Theme/Locale/Delete rows still behave.
    - After Step 3, exported file contains readable JSON with `version`, `exportedAt`, `appVersion`, and `collection` only.
    - After Step 4, provider restore path can replace collection without flipping app into global storage-error state.
    - After Step 5, restoring a known backup updates at least one album page immediately in UI.
    - After Step 6, invalid page ids, invalid sticker ids, duplicate sticker ids, and wrong schema version all fail before any write call.
  - Post-implementation verification and regression checks:
    - Exported backup from one device/session can restore on a clean session and reproduce collected stickers.
    - Cancelled picker flows leave collection untouched and avoid misleading error states.
    - Delete app data, theme switching, locale switching, share export, and scanner mocks still pass after provider/context changes.
    - `pnpm complete-check` stays green.

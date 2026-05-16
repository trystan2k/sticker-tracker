---
title: STR-30 EP14 Scanner Implementation
type: development-log
permalink: docs/development-logs/task-STR-30-EP14-Scanner-Implementation
---

## Metadata

- Task ID: STR-30 (epic)
- Date: 2026-05-15
- Project: sticker-tracker
- Branch: feature/STR-30-scanner-implementation
- Commit: c87a387 (branch), stashed WIP (835b886)

## Objective

Implement camera-based sticker code scanner using Tesseract.js OCR. Pipeline: camera capture → OCR text extraction → sticker code parsing → album lookup → review/edit modal → batch collection update. Feature-flagged, disabled in production by default.

## Implementation Summary

### 1. Feature Flag System (`src/config/features.ts`)

- `resolveScannerEnabled()`: reads `VITE_SCANNER_ENABLED` env var. `true`/`false` explicit, fallback `!env.PROD` (enabled in dev only).
- `FEATURE_FLAGS.scannerEnabled` singleton consumed by route guard and HomeHeader.

### 2. Scanner Route (`src/routes/scanner.tsx`)

- File-based route at `/scanner` with `createFileRoute`.
- `beforeLoad` guard: redirects to `/` when `scannerEnabled` is false.
- `ScannerRoute` component: lazy-loads `ScannerScreen`, handles back navigation (history.back or navigate home).
- Wrapped in `<Suspense fallback={null}>`.

### 3. Scanner Screen (`src/components/scanner/ScannerScreen.tsx`)

- 4-state machine: `idle | active | denied | unsupported`.
- `idle`: shows camera icon, "NEW" badge, description, start CTA.
- `active`: live camera feed with viewfinder overlay, status bar, finish button, auto-scan loop.
- `denied`: camera permission blocked — shows ShieldAlert icon, retry CTA.
- `unsupported`: no getUserMedia — shows Smartphone icon, back CTA.
- Auto-scan loop: `SCAN_DEBOUNCE_MS` (2s) interval, calls `recognizeFromVideo()` → `lookupSticker()` → builds `scannedItems` array.
- Scan result popup shows on match (already have / missing).
- Finish scanning → opens ReviewModal with accumulated items.
- Session ID ref prevents stale async results.
- Cleanup on unmount via `useEffect`.

### 4. OCR Service (`src/services/scanner-ocr.ts`)

- Lazy-loads `tesseract.js` (dynamic import, cached singleton).
- `recognizeFromVideo()`: draws video frame to offscreen canvas → Tesseract `recognize()` → returns text string.
- `SCAN_DEBOUNCE_MS = 2000` exported constant.

### 5. Parser Service (`src/services/scanner-parser.ts`)

- Pipeline of 3 parsers: `parseOpeningSticker` (00) → `parseCcCode` (CC1–CC14) → `parseTeamCode` (XXX-N).
- Normalizes input: uppercase, strips non-alphanumeric to spaces, trims.
- Team code regex: `^([A-Z]{3})\s*(\d{1,3})$`, strips leading zeros.
- CC code: `^CC\s*(\d{1,2})$`, validates range 1–14.
- Returns discriminated union: `{ state: 'matched', code }` | `{ state: 'unmatched' }`.

### 6. Lookup Service (`src/services/scanner-lookup.ts`)

- Builds reverse lookup index: `stickerId → { pageId, pageType, translationKey, albumCode, group, flagCode }`.
- Version hash computed from album data (hash-combine over pageId, translationKey, stickerIds).
- Persists to IndexedDB via `app-storage` key `scannerLookup`. Auto-rebuilds when version changes.
- In-memory cache (`lookupCache`) to avoid redundant reads.
- `lookupSticker()`: parse → ensure index → find match → read collection → return full result with `hasSticker`/`missingSticker`.

### 7. Collection Batch Update (`src/services/scanner-collection.ts`)

- `markStickersAsHave()`: batch operation using single IDB transaction.
- Reads `scannerLookup` + `collection` in same transaction, validates each sticker against lookup, adds to collection set.
- Deduplicates input sticker IDs. Only adds stickers not already collected.
- Returns updated collection state + list of actually updated IDs.

### 8. Viewfinder Overlay (`src/components/scanner/ViewfinderOverlay.tsx`)

- CSS-only viewfinder: dimmed top/sides/bottom, center transparent area with corner brackets.
- Animated scan line when `isScanning` is true.

### 9. Scan Result Popup (`src/components/scanner/ScanResultPopup.tsx`)

- Portal-based modal: shows sticker number + status (already have / missing).
- Focus trap: Tab/Shift+Tab cycle, Escape to close.
- Auto-focuses first focusable element on open.

### 10. Review Modal (`src/components/scanner/ReviewModal.tsx`)

- Portal-based full-screen modal listing all scanned items.
- Each item is editable (input with auto-uppercase, no autocorrect, no spellcheck).
- Per-item validation via `parseStickerNumber` — shows error for invalid formats.
- Duplicate detection: shows count of duplicates to be filtered.
- Delete individual items.
- Confirm button disabled when items empty or any invalid.
- Calls `appState.markScannedStickersAsHave()` on confirm → updates collection → navigates home.

### Integration Points

- **HomeHeader**: Camera icon button visible when `scannerEnabled`, navigates to `/scanner`.
- **AppStateProvider**: added `markScannedStickersAsHave` method wiring scanner-collection to React state.
- **app-storage**: added `PersistedScannerLookupEntry` type + `scannerLookup` storage key.
- **i18n**: scanner keys added for en, es, pt-BR (idle, active, denied, unsupported, review, popup states).
- **AlbumPageHeader**: updated tests for scanner CTA context.

## Files Changed

### Created

- `src/config/features.ts` — feature flag resolver + FEATURE_FLAGS singleton
- `src/routes/scanner.tsx` — scanner route with feature-flag guard
- `src/services/scanner-ocr.ts` — Tesseract.js lazy-load + video frame OCR
- `src/services/scanner-parser.ts` — sticker code parser pipeline (team/CC/00)
- `src/services/scanner-lookup.ts` — reverse lookup index + lookup orchestration
- `src/services/scanner-collection.ts` — batch collection update via IDB transaction
- `src/components/scanner/ScannerScreen.tsx` — main scanner UI component (4-state machine)
- `src/components/scanner/ScannerScreen.module.css` — scanner screen styles
- `src/components/scanner/ViewfinderOverlay.tsx` — camera viewfinder overlay
- `src/components/scanner/ViewfinderOverlay.module.css` — viewfinder styles
- `src/components/scanner/ScanResultPopup.tsx` — scan result popup with focus trap
- `src/components/scanner/ScanResultPopup.module.css` — popup styles
- `src/components/scanner/ReviewModal.tsx` — review/edit scanned stickers modal
- `src/components/scanner/ReviewModal.module.css` — review modal styles
- `test/services/scanner-parser.test.ts` — parser unit tests (30+ cases)
- `test/services/scanner-lookup.test.ts` — lookup service tests (20+ cases)
- `test/services/scanner-collection.test.ts` — collection batch update tests
- `test/services/scanner-ocr.browser.test.ts` — OCR browser tests
- `test/routes/scanner.test.tsx` — route definition + beforeLoad tests
- `test/routes/scanner.browser.test.tsx` — route component browser tests (mount, back navigation)
- `test/routes/scanner-disabled.test.tsx` — feature-flag disabled redirect test
- `e2e/scanner-flow.test.ts` — E2E scanner idle/active/finish flow
- `e2e/scanner-permission.test.ts` — E2E permission denied/unsupported states

### Modified

- `src/components/home/HomeHeader.tsx` — added Camera icon button for scanner navigation (feature-flagged)
- `src/components/album-viewer/AlbumPageHeader.tsx` — updated for scanner context
- `src/components/album-viewer/AlbumPageHeader.module.css` — style additions
- `src/providers/AppStateProvider.tsx` — added `markScannedStickersAsHave` to context + wiring
- `src/lib/storage/app-storage.ts` — added `PersistedScannerLookupEntry` type + `scannerLookup` storage key
- `src/locales/en/translation.json` — scanner i18n keys (~20 keys)
- `src/locales/es/translation.json` — scanner i18n keys (~20 keys)
- `src/locales/pt-BR/translation.json` — scanner i18n keys (~20 keys)
- `src/routeTree.gen.ts` — auto-generated route tree with /scanner
- `test/components/album-viewer/AlbumPageHeader.browser.test.tsx` — test updates
- `test/components/home/HomeScreen.browser.test.tsx` — test updates for scanner CTA
- `package.json` — added tesseract.js dependency
- `pnpm-lock.yaml` — lockfile update
- `pnpm-workspace.yaml` — workspace config update
- `docs/design/sticker-tracker.pen` — design CTA text update

## Key Decisions

1. **Feature flag via env var + fallback**: `VITE_SCANNER_ENABLED` explicit control, defaults off in production. Avoids exposing incomplete feature to prod users.
2. **Lazy-load Tesseract.js**: ~2MB library loaded on demand via dynamic import, cached as singleton. Reduces initial bundle size.
3. **Scanner lookup index with version hash**: Hash of album data determines when to rebuild the reverse index. Persisted to IDB. Avoids rebuilding on every scan.
4. **Single IDB transaction for batch update**: `markStickersAsHave` reads lookup + collection and writes in one transaction. Atomic and consistent.
5. **Pipeline parser architecture**: Three independent parsers tried in sequence (00 → CC → team). Extensible for future sticker types.
6. **Review modal for accuracy**: OCR is error-prone; review modal lets users fix/edit/delete before committing. Prevents incorrect collection updates.
7. **Session ID for async safety**: Incrementing session ref prevents stale OCR callbacks from previous camera sessions interfering.
8. **Portal-based modals**: ScanResultPopup and ReviewModal use `createPortal` to body, avoiding z-index/overflow issues within scanner layout.

## Validation Performed

### Unit Tests (Vitest)

- **scanner-parser**: 30+ test cases covering team codes (BRA-12, BRA 12, BRA12, lowercase, leading zeros, 3-digit numbers), opening sticker (00), CC codes (CC1–CC14, range validation), invalid inputs (empty, random text, wrong format), edge cases (dots, dashes, tabs, newlines).
- **scanner-lookup**: 20+ tests covering version hash stability, index build completeness (all album pages, all sticker types), find match, ensure index (cache, storage, rebuild), full lookup flow (parse-fail, storage-unavailable, unknown-sticker, matched/missing, matched/have, opening sticker, CC code).
- **scanner-collection**: Batch update tests with mocked IDB (dedup, skip already collected, transaction abort, empty list, storage error).
- **scanner-ocr.browser**: Browser environment OCR tests.
- **scanner route**: Route definition, beforeLoad guard, feature-flag redirect, component mount.
- **scanner-disabled**: Verifies redirect when feature flag off.

### E2E Tests (Playwright)

- **scanner-flow**: Idle state rendering, NEW badge, description text, back navigation, active state with mocked camera (finish button, status updates). WebKit camera mocks skipped (unreliable captureStream).
- **scanner-permission**: Permission denied state (blocked heading, retry button), unsupported device state (no getUserMedia), try-again resets, back from unsupported navigates home.

### QA Gate

- `pnpm complete-check`: typecheck + lint + format + tests passing.

## Risks and Follow-ups

1. **OCR accuracy**: Tesseract.js on low-quality camera input may produce unreliable results. Review modal mitigates but UX could frustrate users with frequent misreads. **Follow-up**: Consider barcode/QR code format as alternative, or pretrained model fine-tuned on sticker codes.
2. **Performance on low-end devices**: Tesseract.js processing is CPU-intensive (2s debounce). May lag on older phones. **Follow-up**: Profile on real devices, consider Web Worker offload or smaller OCR model.
3. **WebKit E2E reliability**: Camera mocks unreliable in WebKit (captureStream issues). 3 E2E tests skip on webkit. **Follow-up**: Investigate WebKit-specific mock strategy or use physical device testing.
4. **Production rollout**: Feature currently disabled in production via feature flag. **Follow-up**: Gradual rollout plan — enable for beta users first, monitor OCR success rate before full enable.
5. **Scanner entry point in AlbumPageHeader**: Stash shows changes to AlbumPageHeader but implementation may be incomplete. **Follow-up**: Verify scanner CTA on album page works end-to-end after stash applied.
6. **Design file CTA text update**: `sticker-tracker.pen` updated (remove icon, update CTA text). **Follow-up**: Ensure implementation matches updated design tokens.

---
title: STR-67 EP14 Backup Restore
type: development-log
permalink: docs/development-logs/task-STR-67-EP14-Backup-Restore
---

## Metadata

- Task ID: STR-67 (epic)
- Date: 2026-05-17
- Project: sticker-tracker
- Branch: feature/STR-67-backup-restore
- Commit: (not yet committed)
- Sub-tasks: STR-68 (Backup export end-to-end), STR-69 (Restore valid backup end-to-end), STR-70 (Restore validation, error handling, regression hardening)

## Objective

Implement local backup/restore for sticker collection data. App is client-only, offline-first, IndexedDB-backed. Epic adds backup export (File System Access API + download fallback), restore import (open picker + file-input fallback) with strict validation, validation hardening, error handling, and regression coverage.

## Implementation Summary

### STR-68: Backup Export End-to-End

- Created `src/services/backup-service.ts` with backup schema `{ version: 1, exportedAt (ISO), appVersion, collection }`.
- Implemented `generateBackup()` to serialize current collection with metadata.
- Implemented `saveBackup()` using File System Access API (`showSaveFilePicker`) as primary, `<a download>` as fallback.
- Filename format: `sticker-tracker-backup-YYYY-MM-DDTHH-MM-SS.json` for uniqueness.

### STR-69: Restore Valid Backup End-to-End

- Implemented `openBackup()` using File System Access API (`showOpenFilePicker`) as primary, `<input type="file">` as fallback.
- Implemented `validateBackup()` with strict validation: JSON parse, schema version, pageId validity, stickerId validity, duplicate detection.
- Added `replacePersistedCollection()` to `collection-service.ts` for atomic collection replacement.
- Added `restoreCollection()` callback to `AppStateProvider.tsx`.
- Created `BackupRestoreSheet.tsx` modal sheet with backup/restore actions and inline translated status.
- Wired BackupRestoreSheet into all 3 entry points: HomeScreen, AlbumPageHeader, NotFoundPage.

### STR-70: Restore Validation, Error Handling, Regression Hardening

- Enforced strict validation rejecting unknown pageIds, invalid stickerIds, duplicates, wrong schema version.
- Added `BackupErrorCode` union type for semantic error codes (service returns codes, sheet owns i18n).
- Fixed stale closure race with `useRef` for status state, added busy state to prevent double-actions.
- Overwrite confirm only when collection non-empty (browser-native `confirm`).
- Restore failure stays inline in sheet (does not crash app to storage-error screen).

### Reviews and Fixes

- Code review: 1 major (validation contract), 1 major (status closure race), 3 minors — all fixed.
- Architecture review: 3 majors (validation drift, E2E gaps, missing assertions), 3 minors — all addressed.
- Fix loop: enforced strict validation, fixed stale closure with useRef, added busy state, improved typing with BackupErrorCode union, improved filename uniqueness, fixed browser tests to use `vi.waitFor`.

## Files Changed

Created:

- src/services/backup-service.ts — Backup schema, generation, file I/O (save/open picker + fallbacks), strict validation (JSON, version, pageId, stickerId, duplicates)
- src/components/BackupRestoreSheet.tsx — Modal sheet with backup/restore actions, translated inline status, overwrite confirm
- src/components/BackupRestoreSheet.module.css — Sheet styling (matches ThemeSheet patterns)
- test/services/backup-service.test.ts — Unit tests for validation matrix (26 tests)
- test/services/backup-service.browser.test.ts — Browser tests for file API flows
- test/components/BackupRestoreSheet.browser.test.tsx — Browser tests for sheet UI (14 tests)
- e2e/backup-restore.test.ts — E2E coverage

Modified:

- src/locales/en/translation.json — Drawer + backup/restore translation keys
- src/locales/es/translation.json — Drawer + backup/restore translation keys
- src/locales/pt-BR/translation.json — Drawer + backup/restore translation keys
- src/components/MenuDrawer.tsx — Added Backup/Restore row + callback prop
- src/services/collection-service.ts — Added replacePersistedCollection()
- src/providers/AppStateProvider.tsx — Added restoreCollection() callback
- src/components/home/HomeScreen.tsx — Wired BackupRestoreSheet
- src/components/album-viewer/AlbumPageHeader.tsx — Wired BackupRestoreSheet
- src/components/not-found/NotFoundPage.tsx — Wired BackupRestoreSheet
- test/components/scanner/ScannerScreen.browser.test.tsx — Updated mock context

## Key Decisions

1. **4-layer architecture**: service → collection API → provider → UI. Service returns semantic error codes, sheet owns i18n — keeps validation logic testable without React.
2. **File System Access API primary, file-input/download fallback**: modern UX where supported, graceful degradation everywhere else.
3. **Backup schema**: `{ version: 1, exportedAt (ISO), appVersion, collection }` — versioned for future migration, includes metadata for debugging.
4. **Strict validation**: rejects unknown pageIds, invalid stickerIds, duplicates, wrong schema version — prevents corrupt data entering IndexedDB.
5. **Overwrite confirm only when non-empty**: browser-native `confirm` avoids custom dialog dependency, only prompts when there's data to lose.
6. **Restore failure stays inline**: does not crash app to storage-error screen — user can retry without losing app state.
7. **BackupErrorCode union type**: typed error codes for exhaustive matching in UI layer.

## Validation Performed

- QA: pnpm complete-check — ALL 7 GATES PASSED (knip, typecheck, lint, format, test+coverage, E2E, build)
- 631 tests pass, 2 skipped, 68 test files
- Coverage: 80.95% branches (meets threshold)
- E2E: 58 passed, 6 skipped across Chromium + WebKit
- Code review: all findings resolved (2 majors, 3 minors)
- Architecture review: all findings resolved (3 majors, 3 minors)
- Build: client + SSR + prerender passed
- Lint: oxlint 0 errors

## Risks and Follow-ups

- **File System Access API browser support**: limited to Chromium browsers; fallback works everywhere but less polished UX. Monitor for broader adoption.
- **Future schema migration**: version field in backup schema supports migration path; no migration logic needed until schema v2.
- **Large collection performance**: current implementation serializes full collection; monitor performance with very large datasets.

---
title: 'Epic STR-3 implementation - Local Persistence + i18n Foundation'
type: 'architecture'
permalink: '/development-logs/STR-3-local-persistence-i18n-foundation'
---

## Metadata

- Epic: STR-3 — EP3: Local Persistence + Internationalization Foundation
- Implementation period: 2026-05-10
- Branch: feature/STR-3-local-persistence-internationalization-foundation

## Objective

Implement local persistence services (IndexedDB with fallback) and i18n foundation (react-i18next) for the sticker tracker app.

## Implementation Summary

- STR-7: Created IndexedDB adapter (src/lib/storage/app_storage.ts) using `idb` library with explicit failure states (ready/unavailable/unrecoverable)
- STR-8: Created collection service and locale service with persistence-backed state
- STR-9: Configured react-i18next with en, pt-BR, es locales; created AppStateProvider for bootstrap

## Files Changed/Created

- src/lib/storage/app_storage.ts — IndexedDB adapter
- src/services/collection_service.ts — collection state service
- src/services/locale_service.ts — locale state service
- src/providers/app_state_provider.tsx — bootstrap provider with loading/ready/error states
- src/i18n/config.ts — i18n singleton with eager initialization
- src/locales/en/translation.json — English translations
- src/locales/pt-BR/translation.json — Portuguese (Brazil) translations
- src/locales/es/translation.json — Spanish translations
- src/routes/\_\_root.tsx — root route with provider and lang sync
- src/routes/index.tsx — minimal translated screen with locale switcher
- Test files: test/storage/, test/services/, test/i18n/, test/providers/
- E2E tests: e2e/locale-persistence.test.ts, e2e/welcome-message.test.ts

## Key Decisions

1. Used `idb` library for IndexedDB (not raw IndexedDB API)
2. Explicit failure states instead of throwing errors through UI
3. Eager i18n initialization at module load to avoid translation key flash
4. Write failures use read failure counter (both transaction-level failures)
5. react-i18next for i18n with bundled JSON resources

## Bug Fixes Applied

- MAJOR: Fixed `t()` called before i18n initialized — eager init at module load
- MAJOR: Fixed write failures using wrong counter — now uses classifyReadFailureState
- MAJOR: Fixed useMemo dependency array — wrapped functions in useCallback
- MINOR: Removed dead code guards in services
- MINOR: Added `.catch()` to initializePromise for retry on failure
- MINOR: Changed page title from "TanStack Start Starter" to "Sticker Tracker"

## Validation Performed

- 37 unit/browser tests pass
- 6 E2E tests pass
- All coverage thresholds met (83.63% statements, 74.46% branches, 86.2% functions, 83.39% lines)
- `pnpm complete-check` passes

## Risks/Follow-ups

- Routes `__root.tsx` and `index.tsx` have 0% Vitest coverage (covered by E2E only)
- `<html lang>` briefly shows "en" on first paint before bootstrap (acceptable for SPA)
- E2E tests have no IndexedDB isolation between test files (currently fine since single test per file)

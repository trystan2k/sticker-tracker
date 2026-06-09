---
title: STR-84 Add repeated stickers tracking and repeated-only share flow
type: development-log
permalink: docs/development-logs/task-str-84-ep18-repeated-stickers-tracking-and-share
---

# Development Log: STR-84

## Metadata

- Task ID: STR-84
- Date (UTC): 2026-06-08T21:05:09Z
- Project: sticker-tracker
- Branch: feature/STR-84-add-repeated-stickers-tracking-and-repeated-only-share-flow
- Commit: 49eaaba

## Objective

Add repeated stickers tracking and a repeated-only share flow. Users can mark stickers as collected multiple times, view all repeated stickers grouped by page, and share a repeated-stickers summary.

## Implementation Summary

- **Data model**: Quantity-aware collection model. Each sticker stores `quantity` (≥1). Legacy `{ [id]: true }` schema auto-migrates to `{ [id]: { collected: true, quantity: 1 } }`. Malformed entries handled via fail-soft (treated as uncollected). Unique-only progress math preserved (quantity does not affect completion %).
- **Interaction**: Single tap increments quantity, double-tap decrements, keyboard supports decrement/unmark path. Repeated badge shown when quantity > 1. Accessibility labels reflect count.
- **Repeated screen**: `/repeated` route with grouped pages, empty states, focus recovery after unmark, same interaction semantics as main album.
- **Repeated share flow**: `/repeated-share` with repeated-only formatting (e.g. "BRA 10 (x2)"). Readiness gating (≥1 repeated). Fallback to `/repeated` on invalid state. PNG wrapping for long content.
- **Integration**: Drawer entry for repeated screen, i18n keys, analytics events (`stickers_marked_collected` with `input_method`, `share_preview_generated` for repeated share), backup/restore of quantity data, scanner semantics for repeated increments.
- **Race conditions**: Provider-level serialized collection mutation queue covering manual updates, scanner, restore, and reset. Eliminates interleaved writes corrupting state.

## Files Changed

- `src/providers/AppStateProvider.tsx` — Serialized mutation queue, quantity-aware state, migration logic
- `src/components/album/StickerGrid.*` — Single/double-tap, keyboard decrement, repeated badge
- `src/routes/repeated.tsx` — Repeated screen with grouped pages, empty states
- `src/routes/repeated-share/` — Repeated share flow, PNG generation, formatting
- `src/components/drawer/` — Drawer entry for repeated screen
- `src/services/analytics-service.ts` — Analytics event updates
- `src/services/analytics-consent.ts` — Consent integration
- `src/locales/` — i18n keys for repeated UI
- `src/services/backup/` — Backup/restore quantity data
- `src/routes/` — Route updates, scanner semantics
- `docs/plan/Plan STR-84 Add repeated stickers tracking and repeated-only share flow.md` — Approved deepthink plan

## Key Decisions

- **Fail-soft migration**: Malformed entries silently treated as uncollected instead of crashing. Preserves user data integrity.
- **Serialized mutation queue**: Provider-level queue serializes all collection mutations (manual, scanner, restore, reset) to prevent race conditions. Chosen over per-action locking for simplicity.
- **Quantity does not affect progress**: Progress remains unique-count based. Quantity is supplementary tracking only.
- **Repeated share format**: `CODE NUMBER (xQUANTITY)` chosen for clarity. PNG wrapping handles overflow for long lists.
- **Readiness gating**: Share preview only accessible when ≥1 repeated sticker exists. Fallback redirects to `/repeated`.

## Validation Performed

- `pnpm complete-check` green — unit tests, browser tests, E2E tests, build all passing.
- Code review findings addressed fully.
- Architecture review findings addressed fully.
- Extensive unit test coverage for migration, fail-soft, quantity math.
- E2E tests for repeated screen interactions and share flow.

## Risks and Follow-ups

- **Migration edge cases**: Rare malformed legacy entries may surface in production. Monitoring recommended.
- **Share PNG overflow**: Very large repeated sets may produce large images. Consider capping or paginating if reported.
- **Performance**: Serialized mutation queue adds slight latency to rapid interactions. Monitor for user-perceived delays.
- **Scanner + repeated**: Scanner semantics for repeated increment tested but real-device QR flow may surface edge cases.

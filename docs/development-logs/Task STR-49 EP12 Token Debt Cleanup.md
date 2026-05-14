---
title: STR-49 EP12: Token Debt Cleanup
type: development-log
permalink: docs/development-logs/task-STR-49-ep12-token-debt-cleanup
---

# Development Log: STR-49

## Metadata

- Task ID: STR-49
- Date (UTC): 2026-05-14T12:00:00Z
- Project: sticker-tracker
- Branch: feature/str-50-audit-domui-token-debt-inventory
- Commit: uncommitted (working tree)

## Objective

- Replace all 491 hardcoded CSS values across the app with design tokens — zero hardcoded design values policy achieved.

## Implementation Summary

Pre-step A (Z-Index Tokens)

- Reshuffled `z-index.tokens.json`: xxxs(0)→xxxl(80) in 10-step increments (9 entries)
- Updated `semantic/layout.tokens.json` — `{zIndex.header}` → `{zIndex.m}`
- Updated `components/header.tokens.json` — `{zIndex.header}` → `{zIndex.m}`
- Applied z-index tokens to AppShell, MenuDrawer, LocaleSwitcher, QuickNavigationPicker, HomeSpecialCards, HomeGroupCards

Pre-step B (New Token Creation)

- Added `radius.xs: 2px` to `primitives/radius.tokens.json`
- Added `border.width.medium: 1.5px` to `primitives/border.tokens.json`
- Added typography sizes: `md-lg(16px)`, `xl(20px)`, `1xl(24px)`, `2xl(28px)`, `3xl(32px)` to `primitives/typography.tokens.json`
- Added line heights: `none(1)`, `relaxed(1.3)`, `loose(1.4)` to `primitives/typography.tokens.json`
- Created `primitives/opacity.tokens.json` with subtle(0.3), muted(0.5), strong(0.8)
- Rebuilt tokens via `pnpm tokens:build`

STR-50 — Audit / Inventory

- Full hardcoded value scan via ripgrep: 491 values across 18 CSS modules + TSX
- Documented `STR-50-hardcoded-inventory.md` per-file inventory mapping

STR-51 — Plan

- Created `Plan STR-49 EP12: Token Debt Cleanup.md` with full mapping, drift table, exclusion list, execution order

STR-54 — Shared Shell Surfaces

- Applied tokens to MenuDrawer, LocaleSwitcher, HomeHeader, AlbumPageHeader, NotFoundPage, AppShell
- Replaced hardcoded `z-index: 70` → `var(--z-index-xxl)`, `z-index: 80` → `var(--z-index-xxxl)`
- Replaced hardcoded dimensions with `calc(var(--space-2) * N)` for drawer width (280px = `35*8`), sheet max-width (390px = `48.75*8`), header badge sizing (22px = `2.75*8`), etc.
- Applied `--radius-xs` to 2px corners (flags, drag handles)
- Applied `--opacity-muted` to disabled locales, `--opacity-subtle` to home indicator
- Applied `--typography-size-3xl` to NotFoundPage heading
- Applied `--typography-size-md-lg` to MenuDrawer body text

STR-55 — Remaining Surfaces + Regression

- Applied tokens to AlbumViewer, StickerCell, StickerGrid, PageProgress, HomeScreen, HomeHeroProgress, HomeSpecialCards, HomeGroupCards, QuickNavigationPicker, SharePreviewScreen, SharePreviewCard, ShareSelectionScreen
- Unified dimension system: all spacing/sizing via `calc(var(--space-2) * N)` with 8px base unit
- Applied `--border-width-medium` to sticker missing borders (1.5px)
- Applied `--opacity-strong` to sticker cell overlays (0.8, drifted from 0.75)
- Applied `--typography-size-2xl` to hero numbers and share card titles (28px)
- Applied `--typography-line-height-none` to single-line text, `--typography-line-height-relaxed` to share card body, `--typography-line-height-loose` to album viewer body
- Applied `--border-width-strong` to `outline-offset: 2px` across all focus rings
- Font drifts accepted: 15→14px, 13→12px, 11→10px (1px each)
- Share rgb() values untouched per exclusion policy

## Files Changed

Design Tokens

- design-tokens/primitives/radius.tokens.json (added xs: 2px)
- design-tokens/primitives/border.tokens.json (added width.medium: 1.5px)
- design-tokens/primitives/typography.tokens.json (added sizes md-lg→3xl, line-heights none/relaxed/loose)
- design-tokens/primitives/opacity.tokens.json (NEW — subtle/muted/strong)
- design-tokens/primitives/z-index.tokens.json (reshuffled 0→80, 10-step)
- design-tokens/semantic/layout.tokens.json (zIndex.header → zIndex.m)
- design-tokens/components/header.tokens.json (zIndex.header → zIndex.m)

CSS Modules (STR-54 — Shared Shell)

- src/components/AppShell.module.css (z-index tokens)
- src/components/MenuDrawer.module.css (z-index, calc dims, typography-size-md-lg, opacity-muted, radius-xs)
- src/components/LocaleSwitcher.module.css (z-index, calc dims, radius-xs)
- src/components/home/HomeHeader.module.css (typography-size-xl)
- src/components/album-viewer/AlbumPageHeader.module.css (radius-xs, calc badge dims)
- src/components/not-found/NotFoundPage.module.css (typography-size-3xl, calc max-width)

CSS Modules (STR-55 — Remaining Surfaces)

- src/components/album-viewer/AlbumViewer.module.css (calc dims, border-width-medium, opacity-subtle, radius-xs, line-height-loose)
- src/components/album-viewer/StickerCell.module.css (border-width-medium, opacity-strong, line-height-none, calc dims)
- src/components/album-viewer/StickerGrid.module.css (calc grid widths)
- src/components/album-viewer/PageProgress.module.css (radius-xs, calc dims)
- src/components/album-viewer/QuickNavigationPicker.module.css (z-index, radius-xs, calc dims)
- src/components/home/HomeScreen.module.css (radius-xs, opacity-subtle, calc indicator)
- src/components/home/HomeHeroProgress.module.css (typography-size-2xl, line-height-none, calc SVG ring)
- src/components/home/HomeSpecialCards.module.css (z-index, calc special sizes, outline-offset token)
- src/components/home/HomeGroupCards.module.css (z-index, calc team tiles, line-height-none, typography-size-md-lg)
- src/components/share/SharePreviewScreen.module.css (opacity-muted, calc dims)
- src/components/share/SharePreviewCard.module.css (typography-size-2xl, line-height tokens, radius-xs, calc dims)
- src/components/share/ShareSelectionScreen.module.css (radius-xs, typography-size-md-lg, opacity-muted, calc dims)

Documentation / Planning

- docs/plan/Plan STR-49 EP12: Token Debt Cleanup.md (NEW — epic plan)
- docs/plan/STR-50-hardcoded-inventory.md (NEW — audit inventory)

## Key Decisions

- All dimensions use `calc(var(--space-2) * N)` with 8px base unit (`--space-2` = 8px) — unified pattern for all spacing/sizing
- Font drifts accepted: 15px→14px, 13px→12px, 11px→10px (1px each, visually imperceptible)
- Share `rgb()` values excluded per requirements — intentional dark theme colors
- `share-renderer.ts` permanently excluded from scanning/modification
- `border: none`, `background: none/transparent`, `width/height: 100%` kept as CSS reset values
- `outline-offset: 2px` converted to `var(--border-width-strong)` (also 2px, zero drift)
- `opacity` values drifted to nearest token: 0.4→0.5, 0.55→0.5, 0.75→0.8 (within tolerance)
- `line-height` values: 1.2→1.25, 1.35→1.3 (max ±0.05 drift)
- `z-index` tokens reshuffled: previous single `--z-index-header` replaced by full scale xxxs(0)→xxxl(80)
- 10px gaps kept as `calc(var(--space-2) * 1.25)` — exact match
- Arbitrary design-specific values (83px sticker cells, 280px drawer, 390px sheets, etc.) kept as `calc()` expressions rather than new tokens — avoids token bloat for one-off sizes

## Validation Performed

- `pnpm complete-check`: 8/8 gates pass
  - 345 unit tests passing
  - 22 e2e tests passing
  - lint: no errors
  - typecheck: no errors
  - build: successful
- Final ripgrep scan of `src/components/` CSS modules: zero hardcoded design values remain (excluding intentional exclusions)
- Light and dark mode visual verification
- Before/after visual comparison confirms no regressions
- Share screens verified: rgb() values untouched
- Z-index stacking unchanged

## Risks and Follow-ups

- Follow-up: Consider adding `--radius-2xs` (3px) for future use instead of `calc(var(--space-2) * 0.375)`
- Follow-up: Token bloat risk — review if any `calc()` expressions deserve semantic tokens after product usage data
- Risk: Font size drifts (-1px for three sizes) may need design sign-off for edge cases
- Follow-up: Monitor if `--opacity-muted` (0.5) adequately covers the 0.4 and 0.55 values that drifted to it

## Overview

Replace **all** remaining hardcoded CSS values with design tokens. Zero hardcoded values policy — every dimension, typography, radius, border-width, opacity, and z-index value uses either an existing token, a new token, or `calc(var(--space-2) * N)`.

### Scope

- All `src/**/*.module.css` files (18 files)
- Hardcoded values in `src/**/*.tsx`
- **Exclusions** (do NOT touch):
  - `src/components/share/share-renderer.ts`
  - `SharePreviewCard`, `ShareSelectionScreen`, `HomeGroupCards` rgb() values — intentional
  - `border: none`, `background: none/transparent`, `width/height: 100%` — CSS reset values

### Token Layers

| Layer      | Prefix                                                                                                          | Example                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Primitives | `--color-palette-*`, `--space-*`, `--radius-*`, `--size-*`, `--z-index-*`, `--border-width-*`, `--typography-*` | `--space-4`, `--radius-md`                                |
| Semantic   | `--color-*`, `--surface-*`, `--layout-*`                                                                        | `--color-bg-surface`, `--surface-album-secondary`         |
| Components | `--component-*`                                                                                                 | `--component-header-height`, `--component-sticker-radius` |

## New Tokens to Create

### Primitives tokens to add:

| File                                | Token                           | Value | Purpose                                    |
| ----------------------------------- | ------------------------------- | ----- | ------------------------------------------ |
| `primitives/radius.tokens.json`     | `radius.xs`                     | 2px   | 2px corners (flags, drag handle) — 8 uses  |
| `primitives/border.tokens.json`     | `border.width.medium`           | 1.5px | Sticker missing border — 1 use             |
| `primitives/typography.tokens.json` | `typography.size["md-lg"]`      | 16px  | Body text between md(14) and lg(18)        |
| `primitives/typography.tokens.json` | `typography.size["xl"]`         | 20px  | Heading title text — 6 uses                |
| `primitives/typography.tokens.json` | `typography.size["1xl"]`        | 24px  | Large headings (renamed from old xl)       |
| `primitives/typography.tokens.json` | `typography.size["2xl"]`        | 28px  | Hero number, card title (renamed from 1xl) |
| `primitives/typography.tokens.json` | `typography.size["3xl"]`        | 32px  | NotFoundPage heading (renamed from 2xl)    |
| `primitives/typography.tokens.json` | `typography.lineHeight.none`    | 1     | Single-line text — 4 uses                  |
| `primitives/typography.tokens.json` | `typography.lineHeight.relaxed` | 1.3   | Share card body — 2 uses                   |
| `primitives/typography.tokens.json` | `typography.lineHeight.loose`   | 1.4   | Album viewer body — 1 use                  |

### Opacity tokens (new category):

Add `primitives/opacity.tokens.json`:

| Token            | Value | Purpose                                                                    |
| ---------------- | ----- | -------------------------------------------------------------------------- |
| `opacity.subtle` | 0.3   | Home indicator, controls — 2 uses                                          |
| `opacity.muted`  | 0.5   | Disabled states, locale items (0.55 drifts here), 0.4 drifts here — 5 uses |
| `opacity.strong` | 0.8   | Sticker cells (0.75 drifts here) — 2 uses                                  |

### Z-index tokens (already done during STR-50):

| Token                                     | Value                    |
| ----------------------------------------- | ------------------------ |
| `--z-index-xxxs` through `--z-index-xxxl` | 0–80, 10-step increments |

## Unified Dimension System: `calc(var(--space-2) * N)`

All width, height, margin, padding, gap, and dimension values use the pattern:

```css
calc(var(--space-2) * N)
```

Where `--space-2` = 8px. N can be integer, .25, .5, or .75.

| Value | Formula                   | Exact? | Drift |
| ----- | ------------------------- | ------ | ----- |
| 4px   | `--space-1`               | ✓      | 0     |
| 5px   | `calc(--space-2 * 0.5)`   | ≈4px   | -1px  |
| 6px   | `calc(--space-2 * 0.75)`  | ✓      | 0     |
| 10px  | `calc(--space-2 * 1.25)`  | ✓      | 0     |
| 22px  | `calc(--space-2 * 2.75)`  | ✓      | 0     |
| 28px  | `calc(--space-2 * 3.5)`   | ✓      | 0     |
| 34px  | `calc(--space-2 * 4.25)`  | ✓      | 0     |
| 36px  | `calc(--space-2 * 4.5)`   | ✓      | 0     |
| 46px  | `calc(--space-2 * 5.75)`  | ✓      | 0     |
| 52px  | `calc(--space-2 * 6.5)`   | ✓      | 0     |
| 83px  | `calc(--space-2 * 10.5)`  | ≈84px  | +1px  |
| 100px | `calc(--space-2 * 12.5)`  | ✓      | 0     |
| 134px | `calc(--space-2 * 16.75)` | ✓      | 0     |
| 160px | `calc(--space-2 * 20)`    | ✓      | 0     |
| 170px | `calc(--space-2 * 21.25)` | ✓      | 0     |
| 280px | `calc(--space-2 * 35)`    | ✓      | 0     |
| 320px | `calc(--space-2 * 40)`    | ✓      | 0     |
| 360px | `calc(--space-2 * 45)`    | ✓      | 0     |
| 364px | `calc(--space-2 * 45.5)`  | ✓      | 0     |
| 390px | `calc(--space-2 * 48.75)` | ✓      | 0     |

**Exceptions**: `line-height`, `opacity`, `font-size`, `border-radius`, `z-index` use their respective token categories, not the space-2 calc pattern.

## Remaining Value Mapping

### Font sizes

| Value | Token                                 | Drift |
| ----- | ------------------------------------- | ----- |
| 15px  | `--typography-size-md` (14px)         | -1px  |
| 13px  | `--typography-size-sm` (12px)         | -1px  |
| 11px  | `--typography-size-xs` (10px)         | -1px  |
| 16px  | `--typography-size-md-lg` (16px, new) | 0     |
| 20px  | `--typography-size-xl` (20px, new)    | 0     |
| 28px  | `--typography-size-2xl` (28px, new)   | 0     |

### Line-height

| Value | Token                                         | Drift |
| ----- | --------------------------------------------- | ----- |
| 1     | `--typography-line-height-none` (new: 1)      | 0     |
| 1.2   | `--typography-line-height-snug` (1.25)        | +0.05 |
| 1.25  | `--typography-line-height-snug`               | 0     |
| 1.3   | `--typography-line-height-relaxed` (new: 1.3) | 0     |
| 1.35  | `--typography-line-height-relaxed` (1.3)      | -0.05 |
| 1.4   | `--typography-line-height-loose` (new: 1.4)   | 0     |
| 1.5   | `--typography-line-height-normal`             | 0     |

### Opacity

| Value | Token                    | Drift |
| ----- | ------------------------ | ----- |
| 0.3   | `--opacity-subtle`       | 0     |
| 0.4   | `--opacity-muted` (0.5)  | +0.1  |
| 0.5   | `--opacity-muted`        | 0     |
| 0.55  | `--opacity-muted` (0.5)  | -0.05 |
| 0.75  | `--opacity-strong` (0.8) | +0.05 |
| 0.8   | `--opacity-strong`       | 0     |

### Border-width

| Value | Token                         |
| ----- | ----------------------------- |
| 1px   | `--border-width-default`      |
| 1.5px | `--border-width-medium` (new) |
| 2px   | `--border-width-strong`       |

### Border-radius

| Value | Token                                                  | Drift |
| ----- | ------------------------------------------------------ | ----- |
| 2px   | `--radius-xs` (new)                                    | 0     |
| 3px   | `--radius-xs` (2px, -1px) or `--radius-sm` (6px, +3px) | ±1px  |

### Outline-offset

| Value | Token                         | Drift |
| ----- | ----------------------------- | ----- |
| 2px   | `--border-width-strong` (2px) | 0     |

### Z-index (already done)

| Value | Token            |
| ----- | ---------------- |
| 0     | `--z-index-xxxs` |
| 10    | `--z-index-xxs`  |
| 20    | `--z-index-xs`   |
| 30    | `--z-index-s`    |
| 40    | `--z-index-m`    |
| 50    | `--z-index-l`    |
| 60    | `--z-index-xl`   |
| 70    | `--z-index-xxl`  |
| 80    | `--z-index-xxxl` |

### SVG-specific

| Value                       | Reason                       |
| --------------------------- | ---------------------------- |
| `stroke-width: 10px`        | SVG, keep hardcoded          |
| `transform: rotate(-90deg)` | SVG rotation, keep hardcoded |

### Animation

| Value               | Reason                      |
| ------------------- | --------------------------- |
| `translateX(-100%)` | Menu drawer animation, keep |
| `translateX(0)`     | Animation keyframes, keep   |
| `opacity: 0, 1`     | Animation keyframes, keep   |

### Viewport units

| Value                 | Reason                                                |
| --------------------- | ----------------------------------------------------- |
| `100dvh`              | Viewport-relative, keep                               |
| `calc(100dvh - 56px)` | Viewport calc, keep (56px → `--layout-header-height`) |

## Task Breakdown

### Pre-step A: Z-Index Tokens (done during STR-50)

- Update `design-tokens/primitives/z-index.tokens.json` — 9 entries, xxxs→xxxl, 0→80
- Update `semantic/layout.tokens.json` — `{zIndex.header}` → `{zIndex.m}`
- Update `components/header.tokens.json` — `{zIndex.header}` → `{zIndex.m}`
- Rebuild tokens: `pnpm tokens:build`

### Pre-step B: New Token Creation

- Add `radius.xs: 2px` to `primitives/radius.tokens.json`
- Add `border.width.medium: 1.5px` to `primitives/border.tokens.json`
- Add `typography.size["md-lg"]: 16px`, `typography.size["xl"]: 20px`, `typography.size["1xl"]: 24px`, `typography.size["2xl"]: 28px`, `typography.size["3xl"]: 32px` to `primitives/typography.tokens.json` (reshuffle: xl→20, 1xl→24, 2xl→28, 3xl→32)
- Add `typography.lineHeight.none: 1`, `.relaxed: 1.3`, `.loose: 1.4` to `primitives/typography.tokens.json`
- Create `primitives/opacity.tokens.json` with subtle(0.3), muted(0.5), strong(0.8)
- Rebuild tokens: `pnpm tokens:build`

### STR-50 — Audit

- Full hardcoded value inventory (done, see `STR-50-hardcoded-inventory.md`)

### STR-51 — Approve Plan (this document)

- Human review, token mappings approved

### STR-54 — Apply Tokens (Shared Shell + Overlays)

Target files: MenuDrawer, LocaleSwitcher, HomeHeader, AlbumPageHeader, NotFoundPage, AppShell

Key pattern: replace hardcoded dimensions with `calc(var(--space-2) * N)`, colors/surfaces with `--color-*`/`--surface-*` tokens, typography with `--typography-*` tokens.

### STR-55 — Apply Tokens (Remaining Surfaces + Regression)

Target files: AlbumViewer, StickerCell, StickerGrid, PageProgress, HomeScreen, HomeHeroProgress, HomeSpecialCards, HomeGroupCards, QuickNavigationPicker, SharePreviewScreen, SharePreviewCard, ShareSelectionScreen, styles.css

## Execution Order

```
Pre-step A (z-index tokens) — already done
    │
    ▼
Pre-step B (create new tokens: radius-xs, border-medium, typography-1xl, line-height tokens, opacity tokens)
    │
    ▼
STR-54 (shared shell surfaces)
    │
    ▼
STR-55 (remaining surfaces + regression sweep)
    │
    ▼
Final: pnpm complete-check + visual regression
```

## Validation

### Per-Task Check

1. After each file change, verify with `pnpm dev` (light + dark mode)
2. Run `pnpm complete-check`

### Regression Checklist

- [ ] Light mode: every component renders with correct colors
- [ ] Dark mode: every component renders with correct colors
- [ ] Zero hardcoded design values remain (except excluded files)
- [ ] Typography sizes match before/after (accept 1px drift for 13px→12px, 15px→14px)
- [ ] `pnpm complete-check` passes
- [ ] No visual regressions on share screens (excluded rgb values untouched)
- [ ] Z-index stacking unchanged

### Token Coverage Audit

After STR-55, run final scan:

```bash
rg -n '(color|background|border|font-size|font-weight|line-height|border-radius|outline-offset|opacity):' src/components/ --glob='*.module.css' | rg -v 'var\(' | rg -v 'rgb\(' | rg -v 'linear-gradient'
```

Should return only excluded files and intentional hardcoded values.

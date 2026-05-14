# STR-50: Hardcoded Value Inventory

Generated: 2026-05-14
Method: ripgrep scan of `src/components/` CSS modules + TSX files

## 1. Executive Summary

| Metric                       | Count                                                                      |
| ---------------------------- | -------------------------------------------------------------------------- |
| Total hardcoded values found | 491                                                                        |
| Files scanned                | 18 CSS modules + 1 TSX                                                     |
| Excluded values              | rgb() in share screens (10), gradient (1), share-renderer.ts (entire file) |

### Breakdown by Category

| Category                                             | Count | Examples                                 |
| ---------------------------------------------------- | ----- | ---------------------------------------- |
| Space (gap, padding, margin)                         | ~120  | 8px, 12px, 16px, 24px, 32px              |
| Size (width, height, min/max)                        | ~145  | 83px, 56px, 44px, 34px, 280px            |
| Typography (font-size, weight, line-height)          | ~95   | 15px, 13px, 11px, 700, 1.2               |
| Radius (border-radius)                               | ~35   | 10px, 16px, 12px, 2px, 999px             |
| Border (border-width, border-style)                  | ~30   | 1px, none, 1.5px                         |
| Color (hex, named)                                   | ~20   | `#CC0000`, `transparent`, `none`         |
| Z-index (hardcoded numbers)                          | 6     | 1, 2, 3                                  |
| Opacity                                              | ~8    | 0.3, 0.5, 0.55, 0.75, 0.8                |
| Transform/animation                                  | ~10   | translateX(-100%), rotate(-90deg)        |
| Other (outline-offset, scrollbar-width, line-height) | ~22   | 2px, none, 1, 1.4, 1.3                   |
| RGB values (excluded)                                | 9     | rgb(0 0 0 / 28%), rgb(255 255 255 / 10%) |
| Gradient (excluded)                                  | 1     | linear-gradient(...)                     |

## 2. Per-File Inventory

### 2.1 `AppShell.module.css`

| Line | Property   | Current Value    | Proposed Token   | Notes                   |
| ---- | ---------- | ---------------- | ---------------- | ----------------------- |
| 4    | min-height | 100dvh           | Keep hardcoded   | Viewport unit, no token |
| 20   | inset      | 0                | `var(--space-0)` | Optional                |
| 28   | left       | 50%              | Keep hardcoded   | Centering technique     |
| 29   | transform  | translateX(-50%) | Keep hardcoded   | Centering technique     |

### 2.2 `AlbumViewer.module.css`

| Line | Property        | Current Value | Proposed Token                      | Notes                           |
| ---- | --------------- | ------------- | ----------------------------------- | ------------------------------- |
| 4    | height          | 100dvh        | Keep hardcoded                      | Viewport unit                   |
| 27   | height          | 44px          | `var(--layout-filter-row-height)`   | Matches existing token          |
| 30   | gap             | 8px           | `var(--space-2)`                    |                                 |
| 31   | padding         | 0 16px        | `var(--space-0) var(--space-4)`     |                                 |
| 36   | scrollbar-width | none          | Keep hardcoded                      | CSS property value              |
| 44   | margin-left     | auto          | Keep hardcoded                      | Flex auto margin                |
| 46   | width           | 34px          | Keep hardcoded (arbitrary)          | No semantic token               |
| 47   | height          | 34px          | Keep hardcoded (arbitrary)          | No semantic token               |
| 48   | border-radius   | 999px         | `var(--radius-pill)`                |                                 |
| 49   | border          | none          | Keep                                | Reset value                     |
| 59   | height          | 34px          | Keep hardcoded (arbitrary)          | No semantic token               |
| 60   | padding         | 0 16px        | `var(--space-0) var(--space-4)`     |                                 |
| 61   | border-radius   | 999px         | `var(--radius-pill)`                |                                 |
| 65   | border          | none          | Keep                                | Reset value                     |
| 67   | font-size       | 13px          | `var(--typography-size-sm)` (12px)  | 1px drift accepted              |
| 74   | outline-offset  | 2px           | `var(--space-0-5)`?                 | No exact match; keep or use 2px |
| 80   | font-weight     | 600           | `var(--typography-weight-semibold)` |                                 |
| 86   | font-weight     | 500           | `var(--typography-weight-medium)`   |                                 |
| 90   | padding         | 12px 16px     | `var(--space-3) var(--space-4)`     |                                 |
| 97   | gap             | 8px           | `var(--space-2)`                    |                                 |
| 102  | width           | 83px          | Keep hardcoded (arbitrary)          | Sticker cell width              |
| 103  | height          | 83px          | Keep hardcoded (arbitrary)          | Sticker cell height             |
| 104  | border-radius   | 10px          | `var(--component-sticker-radius)`   |                                 |
| 110  | min-height      | 280px         | Keep hardcoded (arbitrary)          | Empty state height              |
| 114  | padding         | 12px 16px     | `var(--space-3) var(--space-4)`     |                                 |
| 118  | font-size       | 14px          | `var(--typography-size-md)`         |                                 |
| 119  | line-height     | 1.4           | Keep hardcoded                      | No exact token (1.5 is closest) |
| 123  | height          | 34px          | Keep hardcoded (arbitrary)          | No semantic token               |
| 127  | gap             | 8px           | `var(--space-2)`                    |                                 |
| 130  | font-size       | 12px          | `var(--typography-size-sm)`         |                                 |
| 134  | height          | 34px          | Keep hardcoded (arbitrary)          | Safe area height                |
| 142  | width           | 134px         | Keep hardcoded (arbitrary)          | Home indicator                  |
| 143  | height          | 5px           | Keep hardcoded (arbitrary)          | Home indicator                  |
| 144  | border-radius   | 3px           | `var(--radius-sm)`?                 | 6px → 3px mismatch              |
| 146  | opacity         | 0.3           | Keep hardcoded                      | No opacity tokens               |

### 2.3 `PageProgress.module.css`

| Line | Property      | Current Value | Proposed Token                     | Notes                             |
| ---- | ------------- | ------------- | ---------------------------------- | --------------------------------- |
| 4    | gap           | 6px           | Keep hardcoded                     | No space token for 6px            |
| 5    | padding       | 12px 16px     | `var(--space-3) var(--space-4)`    |                                   |
| 17   | font-size     | 13px          | `var(--typography-size-sm)` (12px) | 1px drift                         |
| 18   | font-weight   | 500           | `var(--typography-weight-medium)`  |                                   |
| 24   | font-size     | 13px          | `var(--typography-size-sm)` (12px) | 1px drift                         |
| 25   | font-weight   | 700           | `var(--typography-weight-bold)`    |                                   |
| 30   | width         | 100%          | Keep hardcoded                     | Percentage                        |
| 31   | height        | 6px           | `var(--component-progress-height)` | Matches existing token            |
| 32   | border-radius | 3px           | Keep hardcoded                     | Half of 6px height, design intent |
| 38   | height        | 100%          | Keep hardcoded                     | Percentage                        |
| 40   | border-radius | 3px           | Keep hardcoded                     | Matches track radius              |

### 2.4 `StickerCell.module.css`

| Line | Property       | Current Value | Proposed Token                              | Notes                    |
| ---- | -------------- | ------------- | ------------------------------------------- | ------------------------ |
| 2    | width          | 83px          | Keep hardcoded (arbitrary)                  | Sticker cell design size |
| 3    | height         | 83px          | Keep hardcoded (arbitrary)                  | Sticker cell design size |
| 9    | gap            | 2px           | Keep hardcoded                              | No space token for 2px   |
| 10   | border-radius  | 10px          | `var(--component-sticker-radius)`           |                          |
| 11   | border         | none          | Keep                                        | Reset value              |
| 13   | padding        | 0             | `var(--space-0)`                            | Optional                 |
| 18   | outline-offset | 2px           | Keep hardcoded                              | Focus ring               |
| 34   | font-size      | 11px          | `var(--typography-size-xs)` (10px)          | 1px drift                |
| 35   | font-weight    | 700           | `var(--typography-weight-bold)`             |                          |
| 36   | opacity        | 0.75          | Keep hardcoded                              | No opacity tokens        |
| 38   | line-height    | 1             | `var(--typography-line-height-tight)` (1.1) | 0.1 drift                |
| 43   | font-size      | 18px          | `var(--typography-size-lg)`                 |                          |
| 45   | line-height    | 1             | `var(--typography-line-height-tight)` (1.1) | 0.1 drift                |
| 49   | font-weight    | 700           | `var(--typography-weight-bold)`             |                          |
| 53   | font-weight    | 600           | `var(--typography-weight-semibold)`         |                          |
| 58   | opacity        | 0.8           | Keep hardcoded                              | No opacity tokens        |

### 2.5 `StickerGrid.module.css`

| Line | Property | Current Value | Proposed Token                  | Notes |
| ---- | -------- | ------------- | ------------------------------- | ----- |
| 2    | padding  | 12px 16px     | `var(--space-3) var(--space-4)` |       |
| 7    | gap      | 8px           | `var(--space-2)`                |       |

### 2.6 `AlbumPageHeader.module.css`

| Line | Property       | Current Value | Proposed Token                       | Notes             |
| ---- | -------------- | ------------- | ------------------------------------ | ----------------- |
| 4    | gap            | 8px           | `var(--space-2)`                     |                   |
| 5    | height         | 56px          | `var(--component-header-height)`     |                   |
| 6    | padding        | 0 16px        | `var(--space-0) var(--space-4)`      |                   |
| 12   | border         | none          | Keep                                 | Reset value       |
| 13   | padding        | 0             | `var(--space-0)`                     |                   |
| 14   | background     | none          | Keep                                 | Reset value       |
| 16   | font-size      | 20px          | `var(--typography-size-xl)`          |                   |
| 17   | font-weight    | 800           | `var(--typography-weight-extrabold)` |                   |
| 24   | outline-offset | 2px           | Keep hardcoded                       | Focus ring        |
| 28   | height         | 24px          | Keep hardcoded (arbitrary)           | No semantic token |
| 29   | border         | none          | Keep                                 | Reset value       |
| 30   | padding        | 0             | `var(--space-0)`                     |                   |
| 31   | background     | none          | Keep                                 | Reset value       |
| 37   | outline-offset | 2px           | Keep hardcoded                       | Focus ring        |
| 43   | gap            | 12px          | `var(--space-3)`                     |                   |
| 46   | min-width      | 0             | Keep hardcoded                       | CSS reset         |
| 51   | background     | none          | Keep                                 | Reset value       |
| 52   | border         | none          | Keep                                 | Reset value       |
| 53   | padding        | 0             | `var(--space-0)`                     |                   |
| 54   | min-width      | 0             | Keep hardcoded                       | CSS reset         |
| 60   | outline-offset | 2px           | Keep hardcoded                       | Focus ring        |
| 64   | width          | 24px          | `var(--size-icon-lg)`                |                   |
| 65   | height         | 16px          | Keep hardcoded                       | Flag aspect ratio |
| 66   | border-radius  | 2px           | Keep hardcoded                       | No token for 2px  |
| 72   | font-size      | 15px          | `var(--typography-size-md)` (14px)   | 1px drift         |
| 73   | font-weight    | 700           | `var(--typography-weight-bold)`      |                   |
| 82   | min-width      | 22px          | Keep hardcoded (arbitrary)           | Badge size        |
| 83   | height         | 22px          | Keep hardcoded (arbitrary)           | Badge size        |
| 84   | padding        | 0 8px         | `var(--space-0) var(--space-2)`      |                   |
| 89   | font-size      | 11px          | `var(--typography-size-xs)` (10px)   | 1px drift         |
| 90   | font-weight    | 700           | `var(--typography-weight-bold)`      |                   |

### 2.7 `QuickNavigationPicker.module.css`

| Line | Property         | Current Value | Proposed Token                                                    | Notes                   |
| ---- | ---------------- | ------------- | ----------------------------------------------------------------- | ----------------------- |
| 3    | inset            | 0             | `var(--space-0)`                                                  |                         |
| 13   | inset            | 0             | `var(--space-0)`                                                  |                         |
| 14   | border           | none          | Keep                                                              | Reset value             |
| 15   | padding          | 0             | `var(--space-0)`                                                  |                         |
| 16   | background-color | transparent   | Keep                                                              | Reset value             |
| 21   | width            | 100%          | Keep                                                              | Percentage              |
| 22   | max-width        | 390px         | Keep hardcoded (arbitrary)                                        | Sheet max width         |
| 23   | max-height       | 80vh          | Keep hardcoded                                                    | Viewport unit           |
| 27   | border-radius    | 16px 16px 0 0 | `var(--radius-lg) var(--radius-lg) var(--space-0) var(--space-0)` |                         |
| 34   | padding-top      | 10px          | Keep hardcoded                                                    | No space token for 10px |
| 38   | width            | 36px          | Keep hardcoded (arbitrary)                                        | Drag handle             |
| 39   | height           | 4px           | Keep hardcoded (arbitrary)                                        | Drag handle             |
| 40   | border-radius    | 2px           | Keep hardcoded                                                    | No token for 2px        |
| 45   | height           | 56px          | `var(--component-header-height)`                                  |                         |
| 49   | padding          | 0 16px        | `var(--space-0) var(--space-4)`                                   |                         |
| 53   | margin           | 0             | `var(--space-0)`                                                  |                         |
| 55   | font-size        | 18px          | `var(--typography-size-lg)`                                       |                         |
| 56   | font-weight      | 700           | `var(--typography-weight-bold)`                                   |                         |
| 61   | width            | 32px          | Keep hardcoded (arbitrary)                                        | Close button            |
| 62   | height           | 32px          | Keep hardcoded (arbitrary)                                        | Close button            |
| 63   | border           | none          | Keep                                                              | Reset value             |
| 64   | border-radius    | 16px          | `var(--radius-lg)`                                                |                         |
| 75   | outline-offset   | 2px           | Keep hardcoded                                                    | Focus ring              |
| 79   | margin           | 0 16px 8px    | `var(--space-0) var(--space-4) var(--space-2)`                    |                         |
| 80   | height           | 40px          | Keep hardcoded (arbitrary)                                        | Search box height       |
| 83   | gap              | 8px           | `var(--space-2)`                                                  |                         |
| 84   | padding          | 0 12px        | `var(--space-0) var(--space-3)`                                   |                         |
| 86   | border-radius    | 10px          | `var(--radius-md)`                                                |                         |
| 95   | width            | 100%          | Keep                                                              | Percentage              |
| 96   | border           | none          | Keep                                                              | Reset value             |
| 97   | background       | transparent   | Keep                                                              | Reset value             |
| 99   | font-size        | 14px          | `var(--typography-size-md)`                                       |                         |
| 104  | outline-offset   | 2px           | Keep hardcoded                                                    | Focus ring              |
| 109  | padding          | 0 16px 16px   | `var(--space-0) var(--space-4) var(--space-4)`                    |                         |
| 113  | margin-top       | 12px          | `var(--space-3)`                                                  |                         |
| 117  | margin           | 0 0 6px       | Keep hardcoded                                                    | 6px has no token        |
| 119  | font-size        | 12px          | `var(--typography-size-sm)`                                       |                         |
| 120  | font-weight      | 600           | `var(--typography-weight-semibold)`                               |                         |
| 121  | text-transform   | uppercase     | Keep                                                              | CSS property value      |
| 127  | gap              | 8px           | `var(--space-2)`                                                  |                         |
| 131  | height           | 52px          | Keep hardcoded (arbitrary)                                        | Team row height         |
| 132  | width            | 100%          | Keep                                                              | Percentage              |
| 134  | border-radius    | 10px          | `var(--radius-md)`                                                |                         |
| 138  | gap              | 10px          | Keep hardcoded                                                    | No space token for 10px |
| 139  | padding          | 0 12px        | `var(--space-0) var(--space-3)`                                   |                         |
| 145  | outline-offset   | 2px           | Keep hardcoded                                                    | Focus ring              |
| 149  | width            | 24px          | `var(--size-icon-lg)`                                             |                         |
| 150  | height           | 16px          | Keep hardcoded                                                    | Flag aspect ratio       |
| 151  | border-radius    | 2px           | Keep hardcoded                                                    | No token for 2px        |
| 156  | width            | 10px          | Keep hardcoded                                                    | Dot indicator           |
| 157  | height           | 10px          | Keep hardcoded                                                    | Dot indicator           |
| 158  | border-radius    | 5px           | Keep hardcoded                                                    | Half of 10px            |
| 167  | font-size        | 14px          | `var(--typography-size-md)`                                       |                         |
| 168  | font-weight      | 600           | `var(--typography-weight-semibold)`                               |                         |
| 173  | font-size        | 12px          | `var(--typography-size-sm)`                                       |                         |
| 174  | font-weight      | 500           | `var(--typography-weight-medium)`                                 |                         |

### 2.8 `NotFoundPage.module.css`

| Line | Property       | Current Value | Proposed Token                              | Notes             |
| ---- | -------------- | ------------- | ------------------------------------------- | ----------------- |
| 2    | min-height     | 100dvh        | Keep hardcoded                              | Viewport unit     |
| 16   | width          | 100%          | Keep                                        | Percentage        |
| 17   | max-width      | 360px         | Keep hardcoded (arbitrary)                  | Content max width |
| 36   | margin         | 0             | `var(--space-0)`                            |                   |
| 39   | font-weight    | 700           | `var(--typography-weight-bold)`             |                   |
| 40   | line-height    | 1.2           | `var(--typography-line-height-snug)` (1.25) | 0.05 drift        |
| 45   | margin         | 0             | `var(--space-0)`                            |                   |
| 48   | font-weight    | 400           | `var(--typography-weight-regular)`          |                   |
| 49   | line-height    | 1.5           | `var(--typography-line-height-normal)`      |                   |
| 54   | width          | 100%          | Keep                                        | Percentage        |
| 55   | height         | 48px          | Keep hardcoded (arbitrary)                  | CTA button height |
| 59   | border         | none          | Keep                                        | Reset value       |
| 65   | font-weight    | 700           | `var(--typography-weight-bold)`             |                   |
| 66   | line-height    | 1.25          | `var(--typography-line-height-snug)` (1.25) | Exact match       |
| 73   | outline-offset | 2px           | Keep hardcoded                              | Focus ring        |

### 2.9 `HomeScreen.module.css`

| Line | Property      | Current Value       | Proposed Token                    | Notes             |
| ---- | ------------- | ------------------- | --------------------------------- | ----------------- |
| 2    | min-height    | 100dvh              | Keep hardcoded                    | Viewport unit     |
| 8    | min-height    | calc(100dvh - 56px) | Use `var(--layout-header-height)` | Comment says so   |
| 27   | width         | 134px               | Keep hardcoded (arbitrary)        | Home indicator    |
| 28   | height        | 5px                 | Keep hardcoded (arbitrary)        | Home indicator    |
| 29   | border-radius | 3px                 | Keep hardcoded                    | Half of 6px       |
| 31   | opacity       | 0.3                 | Keep hardcoded                    | No opacity tokens |
| 35   | min-height    | 100dvh              | Keep hardcoded                    | Viewport unit     |
| 39   | padding       | 16px                | `var(--space-4)`                  |                   |

### 2.10 `HomeHeader.module.css`

| Line | Property       | Current Value | Proposed Token                       | Notes         |
| ---- | -------------- | ------------- | ------------------------------------ | ------------- |
| 4    | gap            | 8px           | `var(--space-2)`                     |               |
| 5    | height         | 56px          | `var(--component-header-height)`     |               |
| 6    | padding        | 0 16px        | `var(--space-0) var(--space-4)`      |               |
| 13   | border         | none          | Keep                                 | Reset value   |
| 14   | padding        | 0             | `var(--space-0)`                     |               |
| 15   | background     | none          | Keep                                 | Reset value   |
| 17   | font-size      | 20px          | `var(--typography-size-xl)`          |               |
| 18   | font-weight    | 800           | `var(--typography-weight-extrabold)` |               |
| 25   | outline-offset | 2px           | Keep hardcoded                       | Focus ring    |
| 29   | margin         | 0             | `var(--space-0)`                     |               |
| 35   | font-size      | 20px          | `var(--typography-size-xl)`          |               |
| 36   | font-weight    | 700           | `var(--typography-weight-bold)`      |               |
| 41   | height         | 24px          | Keep hardcoded (arbitrary)           | Action button |
| 42   | border         | none          | Keep                                 | Reset value   |
| 43   | padding        | 0             | `var(--space-0)`                     |               |
| 44   | background     | none          | Keep                                 | Reset value   |
| 50   | outline-offset | 2px           | Keep hardcoded                       | Focus ring    |

### 2.11 `HomeHeroProgress.module.css`

| Line | Property     | Current Value  | Proposed Token                              | Notes                      |
| ---- | ------------ | -------------- | ------------------------------------------- | -------------------------- |
| 4    | padding      | 24px 16px      | `var(--space-6) var(--space-4)`             |                            |
| 16   | width        | 160px          | Keep hardcoded (arbitrary)                  | SVG ring                   |
| 17   | height       | 160px          | Keep hardcoded (arbitrary)                  | SVG ring                   |
| 23   | stroke-width | 10px           | Keep hardcoded                              | SVG-specific               |
| 32   | transform    | rotate(-90deg) | Keep hardcoded                              | SVG rotation               |
| 43   | inset        | 0              | `var(--space-0)`                            |                            |
| 48   | gap          | 4px            | `var(--space-1)`                            |                            |
| 53   | margin       | 0              | `var(--space-0)`                            |                            |
| 56   | font-size    | 28px           | Keep hardcoded                              | Between xl(24) and 2xl(32) |
| 57   | font-weight  | 800            | `var(--typography-weight-extrabold)`        |                            |
| 58   | line-height  | 1              | `var(--typography-line-height-tight)` (1.1) | 0.1 drift                  |
| 62   | margin       | 0              | `var(--space-0)`                            |                            |
| 65   | font-size    | 14px           | `var(--typography-size-md)`                 |                            |
| 66   | font-weight  | 500            | `var(--typography-weight-medium)`           |                            |
| 67   | line-height  | 1.2            | `var(--typography-line-height-snug)` (1.25) | 0.05 drift                 |

### 2.12 `HomeSpecialCards.module.css`

| Line | Property       | Current Value | Proposed Token                                 | Notes                     |
| ---- | -------------- | ------------- | ---------------------------------------------- | ------------------------- |
| 2    | padding        | 0 16px 24px   | `var(--space-0) var(--space-4) var(--space-6)` |                           |
| 7    | margin         | 0 0 12px      | `var(--space-0) var(--space-0) var(--space-3)` |                           |
| 10   | font-size      | 20px          | `var(--typography-size-xl)`                    |                           |
| 11   | font-weight    | 700           | `var(--typography-weight-bold)`                |                           |
| 17   | gap            | 10px          | Keep hardcoded                                 | No space token for 10px   |
| 26   | border-radius  | 12px          | Keep hardcoded                                 | Between md(10) and lg(16) |
| 38   | inset          | 0             | `var(--space-0)`                               |                           |
| 39   | border         | none          | Keep                                           | Reset value               |
| 40   | border-radius  | 12px          | Keep hardcoded                                 | Between md(10) and lg(16) |
| 41   | background     | transparent   | Keep                                           | Reset value               |
| 43   | z-index        | 3             | Keep hardcoded                                 | Intra-component stacking  |
| 48   | outline-offset | 2px           | Keep hardcoded                                 | Focus ring                |
| 52   | width          | 6px           | Keep hardcoded                                 | No space token for 6px    |
| 59   | z-index        | 2             | Keep hardcoded                                 | Intra-component stacking  |
| 61   | padding        | 12px          | `var(--space-3)`                               |                           |
| 68   | gap            | 8px           | `var(--space-2)`                               |                           |
| 69   | margin-bottom  | 8px           | `var(--space-2)`                               |                           |
| 73   | margin         | 0             | `var(--space-0)`                               |                           |
| 76   | font-size      | 15px          | `var(--typography-size-md)` (14px)             | 1px drift                 |
| 77   | font-weight    | 700           | `var(--typography-weight-bold)`                |                           |
| 81   | margin         | 0             | `var(--space-0)`                               |                           |
| 84   | font-size      | 13px          | `var(--typography-size-sm)` (12px)             | 1px drift                 |
| 85   | font-weight    | 600           | `var(--typography-weight-semibold)`            |                           |
| 89   | width          | 100%          | Keep                                           | Percentage                |
| 90   | height         | 6px           | `var(--component-progress-height)`             |                           |
| 91   | border-radius  | 999px         | `var(--radius-pill)`                           |                           |
| 97   | height         | 100%          | Keep                                           | Percentage                |
| 98   | border-radius  | 999px         | `var(--radius-pill)`                           |                           |

### 2.13 `HomeGroupCards.module.css`

| Line | Property       | Current Value        | Proposed Token                                 | Notes                     |
| ---- | -------------- | -------------------- | ---------------------------------------------- | ------------------------- |
| 2    | padding        | 0 16px 24px          | `var(--space-0) var(--space-4) var(--space-6)` |                           |
| 7    | margin         | 0 0 12px             | `var(--space-0) var(--space-0) var(--space-3)` |                           |
| 10   | font-size      | 20px                 | `var(--typography-size-xl)`                    |                           |
| 11   | font-weight    | 700                  | `var(--typography-weight-bold)`                |                           |
| 17   | gap            | 12px                 | `var(--space-3)`                               |                           |
| 22   | border-radius  | 12px                 | Keep hardcoded                                 | Between md(10) and lg(16) |
| 25   | padding        | 12px                 | `var(--space-3)`                               |                           |
| 35   | inset          | 0                    | `var(--space-0)`                               |                           |
| 36   | border         | none                 | Keep                                           | Reset value               |
| 37   | border-radius  | 12px                 | Keep hardcoded                                 | Between md(10) and lg(16) |
| 38   | background     | transparent          | Keep                                           | Reset value               |
| 40   | z-index        | 1                    | Keep hardcoded                                 | Intra-component stacking  |
| 45   | outline-offset | 2px                  | Keep hardcoded                                 | Focus ring                |
| 50   | z-index        | 2                    | Keep hardcoded                                 | Intra-component stacking  |
| 54   | margin-bottom  | 8px                  | `var(--space-2)`                               |                           |
| 58   | margin         | 0                    | `var(--space-0)`                               |                           |
| 61   | font-size      | 15px                 | `var(--typography-size-md)` (14px)             | 1px drift                 |
| 62   | font-weight    | 700                  | `var(--typography-weight-bold)`                |                           |
| 66   | margin         | 0                    | `var(--space-0)`                               |                           |
| 69   | font-size      | 13px                 | `var(--typography-size-sm)` (12px)             | 1px drift                 |
| 70   | font-weight    | 600                  | `var(--typography-weight-semibold)`            |                           |
| 75   | z-index        | 2                    | Keep hardcoded                                 | Intra-component stacking  |
| 76   | width          | 100%                 | Keep                                           | Percentage                |
| 77   | height         | 4px                  | Keep hardcoded (arbitrary)                     | Progress height           |
| 78   | border-radius  | 999px                | `var(--radius-pill)`                           |                           |
| 80   | margin-bottom  | 12px                 | `var(--space-3)`                               |                           |
| 85   | height         | 100%                 | Keep                                           | Percentage                |
| 86   | border-radius  | 999px                | `var(--radius-pill)`                           |                           |
| 96   | z-index        | 2                    | Keep hardcoded                                 | Intra-component stacking  |
| 99   | gap            | 8px                  | `var(--space-2)`                               |                           |
| 104  | height         | 100px                | Keep hardcoded (arbitrary)                     | Team tile height          |
| 105  | width          | 160px                | Keep hardcoded (arbitrary)                     | Team tile width           |
| 106  | border         | none                 | Keep                                           | Reset value               |
| 107  | border-radius  | 8px                  | Keep hardcoded                                 | Between sm(6) and md(10)  |
| 109  | padding        | 0                    | `var(--space-0)`                               |                           |
| 116  | outline-offset | 2px                  | Keep hardcoded                                 | Focus ring                |
| 120  | width          | 100%                 | Keep                                           | Percentage                |
| 121  | height         | 100%                 | Keep                                           | Percentage                |
| 128  | inset          | 0                    | `var(--space-0)`                               |                           |
| 129  | background     | linear-gradient(...) | Excluded                                       | Per requirements          |
| 135  | gap            | 2px                  | Keep hardcoded                                 | No space token for 2px    |
| 136  | padding        | 6px                  | Keep hardcoded                                 | No space token for 6px    |
| 140  | margin         | 0                    | `var(--space-0)`                               |                           |
| 143  | font-size      | 20px                 | `var(--typography-size-xl)`                    |                           |
| 144  | font-weight    | 700                  | `var(--typography-weight-bold)`                |                           |
| 145  | line-height    | 1                    | `var(--typography-line-height-tight)` (1.1)    | 0.1 drift                 |
| 149  | margin         | 0                    | `var(--space-0)`                               |                           |
| 152  | font-size      | 16px                 | `var(--typography-size-lg)`                    |                           |
| 153  | font-weight    | 600                  | `var(--typography-weight-semibold)`            |                           |
| 154  | line-height    | 1.2                  | `var(--typography-line-height-snug)` (1.25)    | 0.05 drift                |

### 2.14 `MenuDrawer.module.css`

| Line | Property       | Current Value      | Proposed Token                      | Notes              |
| ---- | -------------- | ------------------ | ----------------------------------- | ------------------ |
| 3    | transform      | translateX(-100%)  | Keep hardcoded                      | Animation          |
| 7    | transform      | translateX(0)      | Keep hardcoded                      | Animation          |
| 13   | opacity        | 0                  | Keep hardcoded                      | Animation          |
| 17   | opacity        | 1                  | Keep hardcoded                      | Animation          |
| 23   | inset          | 0                  | `var(--space-0)`                    |                    |
| 26   | opacity        | 0                  | Keep hardcoded                      | Animation          |
| 31   | opacity        | 1                  | Keep hardcoded                      | Animation          |
| 37   | inset          | 0                  | `var(--space-0)`                    |                    |
| 38   | border         | none               | Keep                                | Reset value        |
| 39   | padding        | 0                  | `var(--space-0)`                    |                    |
| 40   | background     | transparent        | Keep                                | Reset value        |
| 45   | inset          | 0 auto 0 0         | Keep hardcoded                      | Position technique |
| 46   | width          | 280px              | Keep hardcoded (arbitrary)          | Drawer width       |
| 47   | max-width      | calc(100vw - 24px) | Keep hardcoded                      | Responsive calc    |
| 51   | transform      | translateX(-100%)  | Keep hardcoded                      | Animation          |
| 55   | transform      | translateX(0)      | Keep hardcoded                      | Animation          |
| 60   | transform      | translateX(-100%)  | Keep hardcoded                      | Animation          |
| 65   | gap            | 12px               | `var(--space-3)`                    |                    |
| 69   | padding        | 12px               | `var(--space-3)`                    |                    |
| 81   | width          | 170px              | Keep hardcoded (arbitrary)          | Title width        |
| 86   | font-size      | 16px               | `var(--typography-size-lg)`         |                    |
| 87   | font-weight    | 700                | `var(--typography-weight-bold)`     |                    |
| 93   | width          | 32px               | Keep hardcoded (arbitrary)          | Close button       |
| 94   | height         | 32px               | Keep hardcoded (arbitrary)          | Close button       |
| 95   | border         | none               | Keep                                | Reset value        |
| 96   | border-radius  | 16px               | `var(--radius-lg)`                  |                    |
| 108  | padding        | 8px 0              | `var(--space-2) var(--space-0)`     |                    |
| 112  | width          | 100%               | Keep                                | Percentage         |
| 113  | height         | 56px               | `var(--component-header-height)`    |                    |
| 114  | border         | none               | Keep                                | Reset value        |
| 115  | padding        | 0 16px             | `var(--space-0) var(--space-4)`     |                    |
| 116  | background     | transparent        | Keep                                | Reset value        |
| 119  | gap            | 16px               | `var(--space-4)`                    |                    |
| 125  | opacity        | 0.55               | Keep hardcoded                      | No opacity tokens  |
| 133  | font-size      | 16px               | `var(--typography-size-lg)`         |                    |
| 134  | font-weight    | 600                | `var(--typography-weight-semibold)` |                    |
| 139  | width          | 100%               | Keep                                | Percentage         |
| 140  | height         | 1px                | `var(--border-width-hairline)`?     | Or keep hardcoded  |
| 146  | font-size      | 14px               | `var(--typography-size-md)`         |                    |
| 147  | font-weight    | 600                | `var(--typography-weight-semibold)` |                    |
| 152  | width          | 24px               | `var(--size-icon-lg)`               |                    |
| 153  | height         | 16px               | Keep hardcoded                      | Flag aspect ratio  |
| 154  | border-radius  | 2px                | Keep hardcoded                      | No token for 2px   |
| 162  | outline-offset | 2px                | Keep hardcoded                      | Focus ring         |
| 166  | margin-top     | auto               | Keep                                | Flex auto margin   |
| 167  | padding        | 16px               | `var(--space-4)`                    |                    |
| 173  | font-size      | 12px               | `var(--typography-size-sm)`         |                    |
| 174  | font-weight    | 400                | `var(--typography-weight-regular)`  |                    |

### 2.15 `LocaleSwitcher.module.css`

| Line | Property         | Current Value | Proposed Token                                                    | Notes             |
| ---- | ---------------- | ------------- | ----------------------------------------------------------------- | ----------------- |
| 3    | inset            | 0             | `var(--space-0)`                                                  |                   |
| 13   | inset            | 0             | `var(--space-0)`                                                  |                   |
| 14   | border           | none          | Keep                                                              | Reset value       |
| 15   | padding          | 0             | `var(--space-0)`                                                  |                   |
| 16   | background-color | transparent   | Keep                                                              | Reset value       |
| 21   | width            | 100%          | Keep                                                              | Percentage        |
| 22   | max-width        | 390px         | Keep hardcoded (arbitrary)                                        | Sheet max width   |
| 23   | height           | 364px         | Keep hardcoded (arbitrary)                                        | Sheet height      |
| 25   | border-radius    | 16px 16px 0 0 | `var(--radius-lg) var(--radius-lg) var(--space-0) var(--space-0)` |                   |
| 30   | width            | 36px          | Keep hardcoded (arbitrary)                                        | Drag handle       |
| 31   | height           | 4px           | Keep hardcoded (arbitrary)                                        | Drag handle       |
| 32   | margin           | 12px auto 0   | `var(--space-3) auto var(--space-0)`                              |                   |
| 33   | border-radius    | 2px           | Keep hardcoded                                                    | No token for 2px  |
| 41   | height           | 56px          | `var(--component-header-height)`                                  |                   |
| 42   | padding          | 0 16px        | `var(--space-0) var(--space-4)`                                   |                   |
| 47   | font-size        | 18px          | `var(--typography-size-lg)`                                       |                   |
| 48   | font-weight      | 700           | `var(--typography-weight-bold)`                                   |                   |
| 53   | width            | 32px          | Keep hardcoded (arbitrary)                                        | Close button      |
| 54   | height           | 32px          | Keep hardcoded (arbitrary)                                        | Close button      |
| 55   | border           | none          | Keep                                                              | Reset value       |
| 56   | border-radius    | 16px          | `var(--radius-lg)`                                                |                   |
| 59   | font-size        | 14px          | `var(--typography-size-md)`                                       |                   |
| 67   | width            | 100%          | Keep                                                              | Percentage        |
| 68   | height           | 1px           | Keep hardcoded                                                    | Divider line      |
| 75   | gap              | 8px           | `var(--space-2)`                                                  |                   |
| 76   | padding          | 8px 16px      | `var(--space-2) var(--space-4)`                                   |                   |
| 80   | width            | 100%          | Keep                                                              | Percentage        |
| 81   | height           | 56px          | `var(--component-header-height)`                                  |                   |
| 83   | border-radius    | 10px          | `var(--radius-md)`                                                |                   |
| 87   | gap              | 12px          | `var(--space-3)`                                                  |                   |
| 88   | padding          | 0 16px        | `var(--space-0) var(--space-4)`                                   |                   |
| 93   | width            | 24px          | `var(--size-icon-lg)`                                             |                   |
| 94   | height           | 16px          | Keep hardcoded                                                    | Flag aspect ratio |
| 95   | border-radius    | 2px           | Keep hardcoded                                                    | No token for 2px  |
| 103  | font-size        | 15px          | `var(--typography-size-md)` (14px)                                | 1px drift         |
| 104  | font-weight      | 600           | `var(--typography-weight-semibold)`                               |                   |
| 109  | width            | 20px          | `var(--size-icon-md)`                                             |                   |
| 110  | height           | 20px          | `var(--size-icon-md)`                                             |                   |

### 2.16 `SharePreviewScreen.module.css`

| Line | Property       | Current Value                                      | Proposed Token                        | Notes             |
| ---- | -------------- | -------------------------------------------------- | ------------------------------------- | ----------------- |
| 4    | height         | 100dvh                                             | Keep hardcoded                        | Viewport unit     |
| 13   | gap            | 8px                                                | `var(--space-2)`                      |                   |
| 14   | padding        | 0 16px                                             | `var(--space-0) var(--space-4)`       |                   |
| 20   | width          | 32px                                               | Keep hardcoded (arbitrary)            | Icon button       |
| 21   | height         | 32px                                               | Keep hardcoded (arbitrary)            | Icon button       |
| 22   | border         | none                                               | Keep                                  | Reset value       |
| 23   | border-radius  | 16px                                               | `var(--radius-lg)`                    |                   |
| 24   | background     | transparent                                        | Keep                                  | Reset value       |
| 33   | margin         | 0                                                  | `var(--space-0)`                      |                   |
| 36   | font-size      | 18px                                               | `var(--typography-size-lg)`           |                   |
| 40   | width          | 32px                                               | Keep hardcoded (arbitrary)            | Header spacer     |
| 41   | height         | 32px                                               | Keep hardcoded (arbitrary)            | Header spacer     |
| 46   | min-height     | 0                                                  | Keep hardcoded                        | CSS reset         |
| 47   | padding        | 16px                                               | `var(--space-4)`                      |                   |
| 55   | padding        | 16px 8px                                           | `var(--space-4) var(--space-2)`       |                   |
| 65   | min-height     | 20px                                               | Keep hardcoded (arbitrary)            | Status area       |
| 66   | margin         | 0                                                  | `var(--space-0)`                      |                   |
| 67   | padding        | 0 16px                                             | `var(--space-0) var(--space-4)`       |                   |
| 69   | font-size      | 13px                                               | `var(--typography-size-sm)` (12px)    | 1px drift         |
| 75   | gap            | 10px                                               | Keep hardcoded                        | No space token    |
| 76   | padding        | 12px 16px calc(16px + env(safe-area-inset-bottom)) | `var(--space-3) var(--space-4)` + env |                   |
| 83   | height         | 44px                                               | `var(--size-control-md)`              |                   |
| 84   | border-radius  | 10px                                               | `var(--radius-md)`                    |                   |
| 85   | font-size      | 15px                                               | `var(--typography-size-md)` (14px)    | 1px drift         |
| 86   | font-weight    | 700                                                | `var(--typography-weight-bold)`       |                   |
| 90   | gap            | 8px                                                | `var(--space-2)`                      |                   |
| 95   | border         | none                                               | Keep                                  | Reset value       |
| 108  | opacity        | 0.5                                                | Keep hardcoded                        | No opacity tokens |
| 115  | outline-offset | 2px                                                | Keep hardcoded                        | Focus ring        |

### 2.17 `SharePreviewCard.module.css` (rgb values excluded)

| Line | Property         | Current Value        | Proposed Token                                    | Notes                      |
| ---- | ---------------- | -------------------- | ------------------------------------------------- | -------------------------- |
| 2    | width            | 100%                 | Keep                                              | Percentage                 |
| 3    | max-width        | 320px                | Keep hardcoded (arbitrary)                        | Card width                 |
| 4    | border-radius    | 16px                 | `var(--radius-lg)`                                |                            |
| 9    | box-shadow       | 0 12px 32px rgb(...) | Excluded                                          | rgb() excluded             |
| 16   | gap              | 12px                 | `var(--space-3)`                                  |                            |
| 17   | padding          | 16px                 | `var(--space-4)`                                  |                            |
| 19   | border-bottom    | 1px solid rgb(...)   | Excluded                                          | rgb() excluded             |
| 24   | min-width        | 0                    | Keep                                              | CSS reset                  |
| 28   | width            | 48px                 | Keep hardcoded (arbitrary)                        | Logo size                  |
| 29   | height           | 48px                 | Keep hardcoded (arbitrary)                        | Logo size                  |
| 30   | border-radius    | 8px                  | Keep hardcoded                                    | Between sm(6) and md(10)   |
| 36   | margin           | 0                    | `var(--space-0)`                                  |                            |
| 38   | font-size        | 28px                 | Keep hardcoded                                    | Between xl(24) and 2xl(32) |
| 39   | line-height      | 1                    | `var(--typography-line-height-tight)` (1.1)       | 0.1 drift                  |
| 44   | margin           | 6px 0 0              | Keep hardcoded                                    | No space token for 6px     |
| 46   | font-size        | 12px                 | `var(--typography-size-sm)`                       |                            |
| 47   | line-height      | 1.3                  | Keep hardcoded                                    | No exact match             |
| 51   | padding          | 12px 16px 10px       | `var(--space-3) var(--space-4) var(--space-2-5)`? | 10px has no token          |
| 55   | padding          | 10px 0               | Keep hardcoded                                    | 10px has no token          |
| 59   | border-top       | 1px solid rgb(...)   | Excluded                                          | rgb() excluded             |
| 65   | gap              | 8px                  | `var(--space-2)`                                  |                            |
| 66   | margin-bottom    | 4px                  | `var(--space-1)`                                  |                            |
| 70   | width            | 18px                 | Keep hardcoded (arbitrary)                        | Flag width                 |
| 71   | height           | 12px                 | Keep hardcoded (arbitrary)                        | Flag height                |
| 72   | border-radius    | 2px                  | Keep hardcoded                                    | No token for 2px           |
| 73   | border           | 1px solid rgb(...)   | Excluded                                          | rgb() excluded             |
| 74   | background-color | rgb(...)             | Excluded                                          | rgb() excluded             |
| 79   | margin           | 0                    | `var(--space-0)`                                  |                            |
| 80   | font-size        | 14px                 | `var(--typography-size-md)`                       |                            |
| 81   | font-weight      | 600                  | `var(--typography-weight-semibold)`               |                            |
| 86   | margin           | 0                    | `var(--space-0)`                                  |                            |
| 87   | font-size        | 12px                 | `var(--typography-size-sm)`                       |                            |
| 88   | line-height      | 1.35                 | Keep hardcoded                                    | No exact match             |
| 93   | padding          | 10px 16px            | Keep hardcoded                                    | 10px has no token          |
| 94   | border-top       | 1px solid rgb(...)   | Excluded                                          | rgb() excluded             |
| 97   | font-size        | 12px                 | `var(--typography-size-sm)`                       |                            |

### 2.18 `ShareSelectionScreen.module.css` (rgb values excluded)

| Line | Property         | Current Value              | Proposed Token                                 | Notes                     |
| ---- | ---------------- | -------------------------- | ---------------------------------------------- | ------------------------- |
| 4    | height           | 100dvh                     | Keep hardcoded                                 | Viewport unit             |
| 13   | padding          | 0 16px                     | `var(--space-0) var(--space-4)`                |                           |
| 14   | gap              | 8px                        | `var(--space-2)`                               |                           |
| 20   | width            | 32px                       | Keep hardcoded (arbitrary)                     | Icon button               |
| 21   | height           | 32px                       | Keep hardcoded (arbitrary)                     | Icon button               |
| 22   | border           | none                       | Keep                                           | Reset value               |
| 23   | border-radius    | 16px                       | `var(--radius-lg)`                             |                           |
| 24   | background       | transparent                | Keep                                           | Reset value               |
| 33   | margin           | 0                          | `var(--space-0)`                               |                           |
| 36   | font-size        | 18px                       | `var(--typography-size-lg)`                    |                           |
| 41   | min-width        | 52px                       | Keep hardcoded (arbitrary)                     | Badge                     |
| 42   | padding          | 4px 10px                   | `var(--space-1)` / Keep 10px                   |                           |
| 47   | font-size        | 12px                       | `var(--typography-size-sm)`                    |                           |
| 48   | font-weight      | 600                        | `var(--typography-weight-semibold)`            |                           |
| 55   | padding          | 10px 16px                  | Keep hardcoded                                 | 10px has no token         |
| 62   | gap              | 12px                       | `var(--space-3)`                               |                           |
| 66   | border           | none                       | Keep                                           | Reset value               |
| 67   | background       | transparent                | Keep                                           | Reset value               |
| 69   | font-size        | 14px                       | `var(--typography-size-md)`                    |                           |
| 70   | font-weight      | 600                        | `var(--typography-weight-semibold)`            |                           |
| 71   | padding          | 0                          | `var(--space-0)`                               |                           |
| 76   | padding          | 4px 10px                   | `var(--space-1)` / Keep 10px                   |                           |
| 80   | font-size        | 12px                       | `var(--typography-size-sm)`                    |                           |
| 81   | font-weight      | 600                        | `var(--typography-weight-semibold)`            |                           |
| 87   | padding          | 8px 16px 16px              | `var(--space-2) var(--space-4) var(--space-4)` |                           |
| 91   | padding          | 10px 0                     | Keep hardcoded                                 | 10px has no token         |
| 95   | margin           | 0 0 8px                    | `var(--space-0) var(--space-0) var(--space-2)` |                           |
| 97   | font-size        | 13px                       | `var(--typography-size-sm)` (12px)             | 1px drift                 |
| 98   | font-weight      | 700                        | `var(--typography-weight-bold)`                |                           |
| 102  | margin           | 0                          | `var(--space-0)`                               |                           |
| 103  | padding          | 0                          | `var(--space-0)`                               |                           |
| 106  | border-radius    | 12px                       | Keep hardcoded                                 | Between md(10) and lg(16) |
| 111  | min-height       | 56px                       | `var(--component-header-height)`               |                           |
| 115  | gap              | 10px                       | Keep hardcoded                                 | No space token            |
| 116  | padding          | 10px 12px                  | Keep hardcoded                                 | 10px has no token         |
| 126  | width            | 28px                       | Keep hardcoded (arbitrary)                     | Flag width                |
| 127  | height           | 20px                       | Keep hardcoded (arbitrary)                     | Flag height               |
| 128  | border-radius    | 3px                        | Keep hardcoded                                 | No token                  |
| 133  | width            | 28px                       | Keep hardcoded (arbitrary)                     | Special mark              |
| 134  | height           | 20px                       | Keep hardcoded (arbitrary)                     | Special mark              |
| 135  | border-radius    | 3px                        | Keep hardcoded                                 | No token                  |
| 137  | background-color | rgb(...)                   | Excluded                                       | rgb() excluded            |
| 147  | font-size        | 14px                       | `var(--typography-size-md)`                    |                           |
| 148  | font-weight      | 600                        | `var(--typography-weight-semibold)`            |                           |
| 153  | font-size        | 12px                       | `var(--typography-size-sm)`                    |                           |
| 157  | width            | 22px                       | Keep hardcoded (arbitrary)                     | Checkbox                  |
| 158  | height           | 22px                       | Keep hardcoded (arbitrary)                     | Checkbox                  |
| 162  | margin-top       | 32px                       | `var(--space-8)`                               |                           |
| 168  | padding          | 12px 16px calc(16px + ...) | `var(--space-3) var(--space-4)` + env          |                           |
| 174  | width            | 100%                       | Keep                                           | Percentage                |
| 175  | height           | 46px                       | Keep hardcoded (arbitrary)                     | Button height             |
| 176  | border           | none                       | Keep                                           | Reset value               |
| 177  | border-radius    | 10px                       | `var(--radius-md)`                             |                           |
| 180  | font-size        | 16px                       | `var(--typography-size-lg)`                    |                           |
| 181  | font-weight      | 700                        | `var(--typography-weight-bold)`                |                           |
| 187  | opacity          | 0.5                        | Keep hardcoded                                 | No opacity tokens         |
| 195  | outline-offset   | 2px                        | Keep hardcoded                                 | Focus ring                |

### 2.19 `src/styles.css`

| Line | Property      | Current Value | Proposed Token | Notes                          |
| ---- | ------------- | ------------- | -------------- | ------------------------------ |
| 61   | --vt-duration | 400ms         | Keep hardcoded | CSS custom property definition |

### 2.20 TSX Files

#### `src/components/home/HomeSpecialCards.tsx`

| Line | Value                                           | File                 | Proposed Action                        |
| ---- | ----------------------------------------------- | -------------------- | -------------------------------------- |
| 13   | `var(--color-brand-sponsor-coca-cola, #CC0000)` | HomeSpecialCards.tsx | Already uses var() with fallback; keep |

## 3. Arbitrary Values Table

Values with no exact token equivalent, for review during STR-51.

| File                             | Line     | Value       | Proposed Action                                |
| -------------------------------- | -------- | ----------- | ---------------------------------------------- |
| MenuDrawer.module.css            | 46       | 280px       | Keep hardcoded (drawer width, design-specific) |
| MenuDrawer.module.css            | 81       | 170px       | Keep hardcoded (title width)                   |
| MenuDrawer.module.css            | 93, 94   | 32px        | Keep hardcoded (close button)                  |
| LocaleSwitcher.module.css        | 22       | 390px       | Keep hardcoded (sheet max-width)               |
| LocaleSwitcher.module.css        | 23       | 364px       | Keep hardcoded (sheet height)                  |
| LocaleSwitcher.module.css        | 30, 31   | 36px × 4px  | Keep hardcoded (drag handle)                   |
| QuickNavigationPicker.module.css | 22       | 390px       | Keep hardcoded (sheet max-width)               |
| QuickNavigationPicker.module.css | 38, 39   | 36px × 4px  | Keep hardcoded (drag handle)                   |
| QuickNavigationPicker.module.css | 80       | 40px        | Keep hardcoded (search box)                    |
| QuickNavigationPicker.module.css | 131      | 52px        | Keep hardcoded (team row)                      |
| QuickNavigationPicker.module.css | 156, 157 | 10px        | Keep hardcoded (dot indicator)                 |
| AlbumViewer.module.css           | 46, 47   | 34px        | Keep hardcoded (share button)                  |
| AlbumViewer.module.css           | 102, 103 | 83px        | Keep hardcoded (sticker cell)                  |
| AlbumViewer.module.css           | 110      | 280px       | Keep hardcoded (empty state)                   |
| AlbumViewer.module.css           | 142      | 134px       | Keep hardcoded (home indicator)                |
| AlbumViewer.module.css           | 143      | 5px         | Keep hardcoded (home indicator)                |
| HomeScreen.module.css            | 27       | 134px       | Keep hardcoded (home indicator)                |
| HomeScreen.module.css            | 28       | 5px         | Keep hardcoded (home indicator)                |
| HomeHeroProgress.module.css      | 16, 17   | 160px       | Keep hardcoded (SVG ring)                      |
| HomeHeroProgress.module.css      | 56       | 28px        | Keep hardcoded (font-size, between tokens)     |
| HomeGroupCards.module.css        | 104      | 100px       | Keep hardcoded (team tile)                     |
| HomeGroupCards.module.css        | 105      | 160px       | Keep hardcoded (team tile)                     |
| HomeGroupCards.module.css        | 77       | 4px         | Keep hardcoded (progress height)               |
| HomeGroupCards.module.css        | 136      | 6px         | Keep hardcoded (padding)                       |
| SharePreviewCard.module.css      | 3        | 320px       | Keep hardcoded (card max-width)                |
| SharePreviewCard.module.css      | 28, 29   | 48px        | Keep hardcoded (logo)                          |
| SharePreviewCard.module.css      | 38       | 28px        | Keep hardcoded (font-size)                     |
| SharePreviewCard.module.css      | 70, 71   | 18px × 12px | Keep hardcoded (flag)                          |
| ShareSelectionScreen.module.css  | 126, 127 | 28px × 20px | Keep hardcoded (flag)                          |
| ShareSelectionScreen.module.css  | 175      | 46px        | Keep hardcoded (button)                        |
| ShareSelectionScreen.module.css  | 157, 158 | 22px        | Keep hardcoded (checkbox)                      |
| ShareSelectionScreen.module.css  | 162      | 32px        | Keep hardcoded (margin-top)                    |
| NotFoundPage.module.css          | 17       | 360px       | Keep hardcoded (content max-width)             |
| NotFoundPage.module.css          | 55       | 48px        | Keep hardcoded (CTA button)                    |
| HomeSpecialCards.module.css      | 52       | 6px         | Keep hardcoded (accent bar)                    |
| AlbumPageHeader.module.css       | 82, 83   | 22px        | Keep hardcoded (badge)                         |
| StickerCell.module.css           | 2, 3     | 83px        | Keep hardcoded (sticker cell)                  |
| PageProgress.module.css          | 4        | 6px         | Keep hardcoded (gap)                           |
| AppShell.module.css              | 4        | 100dvh      | Keep hardcoded (viewport)                      |
| QuickNavigationPicker.module.css | 34       | 10px        | Keep hardcoded (padding-top)                   |
| QuickNavigationPicker.module.css | 138      | 10px        | Keep hardcoded (gap)                           |
| QuickNavigationPicker.module.css | 117      | 6px         | Keep hardcoded (margin-bottom)                 |
| SharePreviewScreen.module.css    | 75       | 10px        | Keep hardcoded (gap)                           |
| SharePreviewCard.module.css      | 55       | 10px        | Keep hardcoded (padding)                       |

## 4. Exclusions

### 4.1 `share-renderer.ts` (entire file excluded)

Permanently excluded from scanning/modification per plan requirements.

### 4.2 `SharePreviewCard.module.css` — rgb() values

| Line | Value                    | Reason                       |
| ---- | ------------------------ | ---------------------------- |
| 9    | `rgb(0 0 0 / 28%)`       | Intentional dark theme color |
| 19   | `rgb(255 255 255 / 10%)` | Intentional dark theme color |
| 59   | `rgb(255 255 255 / 10%)` | Intentional dark theme color |
| 73   | `rgb(255 255 255 / 30%)` | Intentional dark theme color |
| 74   | `rgb(255 255 255 / 14%)` | Intentional dark theme color |
| 94   | `rgb(255 255 255 / 10%)` | Intentional dark theme color |

### 4.3 `ShareSelectionScreen.module.css` — rgb() values

| Line | Value                   | Reason                       |
| ---- | ----------------------- | ---------------------------- |
| 137  | `rgb(238 199 51 / 24%)` | Intentional dark theme color |

### 4.4 `HomeGroupCards.module.css` — gradient

| Line | Value                                                            | Reason           |
| ---- | ---------------------------------------------------------------- | ---------------- |
| 129  | `linear-gradient(to bottom, rgb(0 0 0 / 30%), rgb(0 0 0 / 95%))` | Per requirements |

### 4.5 Values kept hardcoded by convention

- `border: none` — reset value, no token
- `background: none` / `background: transparent` — reset value, no token
- `width: 100%` / `height: 100%` — percentage, no token
- `opacity: *` — no opacity tokens exist
- `transform: translateX(...)` — animation keyframe, no token
- `line-height: 1`, `1.3`, `1.35`, `1.4` — only tight(1.1), snug(1.25), normal(1.5) tokens exist
- `outline-offset: 2px` — focus ring convention, keep
- Dimensions with no token match (83px, 280px, 364px, etc.) — design-specific sizes

## 5. Summary by File

| File                             | Total Hardcoded | Tokenizable | Keep Hardcoded | Excluded |
| -------------------------------- | --------------- | ----------- | -------------- | -------- |
| AppShell.module.css              | 4               | 1           | 3              | 0        |
| AlbumViewer.module.css           | 35              | 21          | 14             | 0        |
| PageProgress.module.css          | 11              | 7           | 4              | 0        |
| StickerCell.module.css           | 16              | 9           | 7              | 0        |
| StickerGrid.module.css           | 2               | 2           | 0              | 0        |
| AlbumPageHeader.module.css       | 31              | 22          | 9              | 0        |
| QuickNavigationPicker.module.css | 56              | 35          | 21             | 0        |
| NotFoundPage.module.css          | 15              | 9           | 6              | 0        |
| HomeScreen.module.css            | 9               | 3           | 6              | 0        |
| HomeHeader.module.css            | 17              | 12          | 5              | 0        |
| HomeHeroProgress.module.css      | 15              | 7           | 8              | 0        |
| HomeSpecialCards.module.css      | 26              | 17          | 9              | 0        |
| HomeGroupCards.module.css        | 46              | 29          | 16             | 1        |
| MenuDrawer.module.css            | 48              | 26          | 22             | 0        |
| LocaleSwitcher.module.css        | 38              | 25          | 13             | 0        |
| SharePreviewScreen.module.css    | 29              | 18          | 11             | 0        |
| SharePreviewCard.module.css      | 36              | 17          | 13             | 6        |
| ShareSelectionScreen.module.css  | 57              | 31          | 25             | 1        |
| styles.css                       | 1               | 0           | 1              | 0        |
| HomeSpecialCards.tsx             | 1               | 0           | 1              | 0        |
| **Total**                        | **491**         | **291**     | **193**        | **8**    |

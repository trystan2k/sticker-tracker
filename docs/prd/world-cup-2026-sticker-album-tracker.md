# FIFA World Cup 2026 Sticker Album Tracker PRD

**Product:** FIFA World Cup 2026 Sticker Album Tracker  
**Document type:** Product Requirements Document (PRD)  
**Target audience:** Development team building the product from scratch  
**Status:** Refined PRD approved for implementation planning  
**Last updated:** 2026-05-08

## PRD Analysis

### Product goal

Build a mobile-first Progressive Web Application (PWA) that lets users track FIFA World Cup 2026 sticker album progress offline, entirely client-side, with no backend or cloud sync.

### Primary users

- Sticker album collectors tracking collected and missing stickers.
- Collectors preparing missing-sticker lists for trading.
- Mobile users who need offline access during real-world collecting/trading.

### Source of truth

- Album structure source: `docs/references/Planilha de figurinhas da copa.pdf`.
- Static album data implementation: `/src/data/album.ts`.
- UI design source: Pencil mockups, expected at `docs/design/sticker-tracker.pen`.
- Design tokens source: `/design-tokens/`, transformed via Style Dictionary into `/src/styles/tokens.css`.

### Current repository readiness

- `docs/prd/` exists.
- Album reference PDF exists at `docs/references/Planilha de figurinhas da copa.pdf`.
- Pencil mockup file is not present yet.
- `design-tokens/` is not present yet.

UI implementation is blocked until Pencil mockups and exported tokens are committed. Data, state, i18n, persistence, tests, PWA, and scanner scaffolding may begin before final UI implementation.

### Album structure

- Total pages: **51**.
- Team pages: **48** national teams.
- Special pages: **3**.
- Team stickers: `48 teams × 20 = 960`.
- Special stickers: `FWC Opening 9 + FWC Closing 11 + Coca-Cola 14 = 34`.
- Total stickers: **994**.
- Group stickers: each group has `4 teams × 20 = 80`.

### Page order

1. FWC Opening
2. Group A teams
3. Group B teams
4. Group C teams
5. Group D teams
6. Group E teams
7. Group F teams
8. Group G teams
9. Group H teams
10. Group I teams
11. Group J teams
12. Group K teams
13. Group L teams
14. FWC Closing
15. Coca-Cola

### Team and special page data

`albumCode` must match the PDF. `flagCode` must be compatible with `flag-icons`; use ISO 3166-1 alpha-2 where possible, with supported regional codes for non-sovereign football teams such as England and Scotland.

| Group | Team pt-BR | albumCode | pageId | flagCode |
|---|---|---:|---|---|
| A | México | MEX | mex | mx |
| A | África do Sul | RSA | rsa | za |
| A | Coreia do Sul | KOR | kor | kr |
| A | Rep. Tcheca | CZE | cze | cz |
| B | Canadá | CAN | can | ca |
| B | Bósnia | BIH | bih | ba |
| B | Catar | QAT | qat | qa |
| B | Suíça | SUI | sui | ch |
| C | Brasil | BRA | bra | br |
| C | Marrocos | MAR | mar | ma |
| C | Haiti | HAI | hai | ht |
| C | Escócia | SCO | sco | gb-sct |
| D | Estados Unidos | USA | usa | us |
| D | Paraguai | PAR | par | py |
| D | Austrália | AUS | aus | au |
| D | Turquia | TUR | tur | tr |
| E | Alemanha | GER | ger | de |
| E | Curaçao | CUW | cuw | cw |
| E | Costa do Marfim | CIV | civ | ci |
| E | Equador | ECU | ecu | ec |
| F | Holanda | NED | ned | nl |
| F | Japão | JPN | jpn | jp |
| F | Suécia | SWE | swe | se |
| F | Tunísia | TUN | tun | tn |
| G | Bélgica | BEL | bel | be |
| G | Egito | EGY | egy | eg |
| G | Irã | IRN | irn | ir |
| G | Nova Zelândia | NZL | nzl | nz |
| H | Espanha | ESP | esp | es |
| H | Cabo Verde | CPV | cpv | cv |
| H | Arábia Saudita | KSA | ksa | sa |
| H | Uruguai | URU | uru | uy |
| I | França | FRA | fra | fr |
| I | Senegal | SEN | sen | sn |
| I | Iraque | IRQ | irq | iq |
| I | Noruega | NOR | nor | no |
| J | Argentina | ARG | arg | ar |
| J | Argélia | ALG | alg | dz |
| J | Áustria | AUT | aut | at |
| J | Jordânia | JOR | jor | jo |
| K | Portugal | POR | por | pt |
| K | Congo | COD | cod | cd |
| K | Uzbequistão | UZB | uzb | uz |
| K | Colômbia | COL | col | co |
| L | Inglaterra | ENG | eng | gb-eng |
| L | Croácia | CRO | cro | hr |
| L | Gana | GHA | gha | gh |
| L | Panamá | PAN | pan | pa |

Special pages:

| Page | pageId | Stickers | Count |
|---|---|---|---:|
| FIFA World Cup History Opening | fwc-opening | `00`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8` | 9 |
| FIFA World Cup History Closing | fwc-closing | `9`, `10`, `11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`, `19` | 11 |
| Coca-Cola | coca-cola | `CC1`–`CC14` | 14 |

### Functional requirements

#### FR1 — Page viewer and sticker tracking

- Each album page is a full-screen card/page.
- Team pages show translated team name, flag, group label, 20 sticker cells, and page progress.
- Special pages show translated title, special-section indicator, sticker cells, and page progress.
- Sticker cells are tappable and toggle between collected and missing.
- Toggle writes immediately to IndexedDB.

#### FR2 — Swipe navigation

- Users navigate left/right through exact album page order.
- Navigation wraps from last page to first page and first page to last page.
- Swipe uses smooth CSS transitions.
- Swipe threshold must be a named constant.
- Horizontal swipe must not conflict with vertical scrolling inside sticker grids.

#### FR3 — Quick navigation picker

- Header button opens slide-in panel or modal.
- Entries are listed in album order: FWC Opening, groups A–L, FWC Closing, Coca-Cola.
- Team entries show translated name, flag, and group label.
- Special entries show translated title and section label.
- Tapping entry navigates to page and closes panel.

#### FR4 — Collection filter

- Persistent filter control: All, Collected, Missing.
- Filter applies to all pages until user changes it.
- Active filter state is visually clear.
- If no stickers match filter on current page, show translated empty state.

#### FR5 — Progress indicators

- Each page shows collected/total counter.
- Global summary screen shows:
  - total collected/994,
  - group breakdown, each out of 80,
  - special section breakdown for FWC Opening, FWC Closing, Coca-Cola.

#### FR6 — Share missing stickers

- Share/export creates one PNG image client-side.
- User can select one, multiple, or all pages.
- Individual page share pre-selects current page.
- Global share starts with selectable list of all pages.
- PNG includes, per selected page:
  - team or section title,
  - flag for teams,
  - group label for teams,
  - missing sticker identifiers.
- Mobile: use Web Share API when available and file sharing is supported.
- Desktop or unsupported share: download PNG.
- All-pages export is allowed; renderer must use columns/pagination or safeguards to avoid oversized canvas failures.

#### FR7 — Internationalisation

- Library: `react-i18next`.
- Locales shipped in v1: `pt-BR`, `es`, `en`.
- Default/fallback locale: `en`.
- Detection order:
  1. saved IndexedDB preference,
  2. `navigator.languages` best match,
  3. `en` fallback.
- Locale files live at `/src/locales/{locale}/translation.json`.
- No hardcoded UI strings in components.
- Translation coverage must include:
  - team names,
  - special page titles,
  - group labels,
  - sticker identifiers where displayed through UI copy,
  - buttons,
  - filters,
  - empty states,
  - progress text,
  - error messages,
  - toast messages,
  - scanner namespace for Phase 2 scaffolding.

#### FR8 — PWA and offline

- App works offline after first successful load.
- Use Vite PWA plugin with Workbox.
- App manifest supports installable PWA behavior.
- Install prompt UX:
  - Chromium/Android: show install action only after `beforeinstallprompt` is captured.
  - iOS/Safari: show Add to Home Screen instructions modal.
  - Unsupported browsers: hide install action or show manual instructions only when useful.
- Service worker updates:
  - detect update in background,
  - show translated toast with reload action,
  - never force reload automatically.

#### FR9 — Scanner Phase 2 scaffolding

Scanner is out of scope for v1 implementation. V1 must only scaffold:

- `/src/features/scanner/README.md` with planned implementation.
- `/src/features/scanner/types.ts` exporting `ScanResult`.
- `scanner` translation namespace in all three locales.
- Header scan slot/component behind feature flag.
- Feature flag default off in production; no visible non-functional scan button in v1.

### Non-functional requirements

- Client-only; no backend, no server persistence, no image upload.
- Offline-first after initial load.
- Mobile-first responsive design; desktop functional.
- Strict TypeScript.
- Accessible keyboard and screen-reader behavior for controls, modals, panels, filters, and share flow.
- All design values must come from CSS custom properties generated from tokens.
- No raw colors, spacing, or font sizes in component CSS where tokens exist.
- IndexedDB failure must degrade to in-memory state and show persistent translated warning toast.
- Initial IndexedDB reads must show skeleton/spinner before rendering collection state.

### Tech stack

| Concern | Tool / decision |
|---|---|
| Framework | React 19 |
| Routing/app shell | TanStack Start, SPA mode, client-only |
| Language | TypeScript strict mode |
| Styling | CSS Modules + CSS custom properties |
| Tokens | Style Dictionary from `/design-tokens/` to `/src/styles/tokens.css` |
| Flags | `flag-icons` |
| i18n | `react-i18next` |
| Local storage | IndexedDB via `idb` |
| PWA | Vite PWA plugin + Workbox |
| Package manager | pnpm |
| Linter | oxlint |
| Formatter | oxfmt |
| Dead code | knip |
| CSS linting | stylelint |
| Commit hooks | commitlint + husky + lint-staged |
| Unit tests | Vitest; browser mode for browser-dependent tests |
| E2E tests | Playwright |
| CI/CD | GitHub Actions |
| Deployment | Cloudflare Workers via Wrangler |

### Data architecture

Required types in `/src/data/album.ts`:

- `AlbumPage`
- `TeamPage`
- `SpecialPage`
- `Group`
- `StickerRange`
- `StickerIdentifier`
- `PageId`

Team pages must include:

- stable `pageId`,
- `type: 'team'`,
- `group`,
- `albumCode`,
- `flagCode`,
- translation key for name,
- sticker ranges `1–10` and `11–20`,
- normalized sticker identifiers used by persistence.

Special pages must include:

- stable `pageId`,
- `type: 'special'`,
- special key,
- translation key for title,
- ordered sticker identifiers,
- album order position.

Dynamic user state:

```ts
type CollectionState = Record<PageId, Set<StickerIdentifier>>;
```

Persistence requirements:

- Store collection state in IndexedDB.
- Store locale preference in IndexedDB.
- Write immediately on every toggle.
- First launch starts with no stickers collected.
- IndexedDB unavailable/error: use in-memory state and persistent warning toast.

## Clarifying Questions

### Resolved decisions

1. **Album source of truth**  
   Use `docs/references/Planilha de figurinhas da copa.pdf` as authoritative album source.

2. **Design source of truth**  
   Pencil mockups and exported design tokens are required before UI implementation starts.

3. **Locale detection**  
   Use IndexedDB saved preference → `navigator.languages` best match → `en` fallback.

4. **Default language**  
   `en` is default/fallback locale.

5. **Album code vs flag code**  
   Store `albumCode` and `flagCode` separately.

6. **IndexedDB wrapper**  
   Use `idb`, not Dexie, for v1.

7. **Share/export output**  
   Generate one PNG containing selected pages.

8. **PWA install**  
   Use platform-specific install UX; do not promise unsupported browser behavior.

9. **Scanner visibility**  
   Scanner feature flag default off; no visible non-functional scan button in production v1.

10. **Vitest browser mode**  
   Browser mode required for browser-dependent tests; pure logic tests may use faster standard Vitest environment.

### Remaining implementation risks

- Pencil mockups and `design-tokens/` are missing; UI work must wait.
- `flag-icons` support for regional home nation flags must be verified during implementation (`gb-eng`, `gb-sct`).
- Large PNG export can hit browser canvas limits; renderer must guard against excessive dimensions.
- PWA update behavior can be difficult to test reliably; needs explicit Playwright test harness.

## Implementation Options

### Option A — Data-first vertical slices (recommended)

Build thin, demoable slices from static album data through persistence, UI, navigation, share, and PWA.

Pros:

- Validates core album correctness early.
- Enables parallel UI work after tokens arrive.
- Keeps risk visible slice by slice.
- Best fit for local-only app.

Cons:

- Requires discipline to avoid overbuilding shared abstractions too early.

### Option B — UI prototype first

Start with swipeable cards and visual interactions, then wire data and persistence later.

Pros:

- Fast early demo.
- Good for design feedback.

Cons:

- Blocked by missing Pencil/tokens.
- Risks rework if static data model or persistence shape changes.
- May hide correctness issues in album ordering/counts.

### Option C — Infrastructure/tooling first

Set up all CI, linting, PWA, deployment, and quality gates before product slices.

Pros:

- Strong foundation.
- Catches quality issues early.

Cons:

- Delays user-visible progress.
- Some tooling choices are easier to tune once real code exists.

### Recommended approach

Use **Option A: Data-first vertical slices**, with minimal foundation tooling before product slices and full CI hardening after core flows exist.

Why:

- Album correctness is product-critical.
- App is local-only, so state/data correctness matters before UI polish.
- Missing Pencil/tokens should not block non-visual foundations.
- Vertical slices keep each increment testable and demoable.

## Recommended Implementation Plan

### User stories

- **US1:** As a collector, I can view every album page in album order.
- **US2:** As a collector, I can mark stickers collected or missing and keep that state after reload.
- **US3:** As a collector, I can swipe between pages naturally on mobile.
- **US4:** As a collector, I can jump directly to a team or special section.
- **US5:** As a collector, I can filter stickers by all, collected, or missing.
- **US6:** As a collector, I can see page, group, special, and global progress.
- **US7:** As a collector, I can export/share a PNG of missing stickers for trading.
- **US8:** As a user, I can use the app offline and install it as a PWA when supported.
- **US9:** As a user, I can use the app in English, Portuguese, or Spanish.
- **US10:** As a future Phase 2 user, scanner architecture exists without affecting v1 bundle.
- **US11:** As a maintainer, I can trust automated checks before deploy.

### Slice breakdown

1. **Title:** Design inputs gate  
   **Type:** HITL  
   **Blocked by:** none  
   **User stories covered:** US1–US9 indirectly

2. **Title:** Project foundation and quality tools  
   **Type:** AFK  
   **Blocked by:** none  
   **User stories covered:** US11

3. **Title:** Static album data and integrity tests  
   **Type:** AFK  
   **Blocked by:** none  
   **User stories covered:** US1, US6

4. **Title:** Local collection persistence  
   **Type:** AFK  
   **Blocked by:** Static album data  
   **User stories covered:** US2

5. **Title:** i18n foundation and locale switcher  
   **Type:** AFK  
   **Blocked by:** Static album data  
   **User stories covered:** US9

6. **Title:** Album page viewer with sticker toggles  
   **Type:** AFK  
   **Blocked by:** Design inputs gate, Static album data, Local collection persistence, i18n foundation  
   **User stories covered:** US1, US2, US6, US9

7. **Title:** Swipe navigation and quick picker  
   **Type:** AFK  
   **Blocked by:** Album page viewer  
   **User stories covered:** US3, US4

8. **Title:** Filter and progress summary  
   **Type:** AFK  
   **Blocked by:** Album page viewer  
   **User stories covered:** US5, US6

9. **Title:** Share missing stickers PNG  
   **Type:** AFK  
   **Blocked by:** Album page viewer, Filter/progress domain helpers  
   **User stories covered:** US7

10. **Title:** PWA offline, install, and update flow  
    **Type:** AFK  
    **Blocked by:** Project foundation, Album page viewer  
    **User stories covered:** US8

11. **Title:** Scanner Phase 2 scaffolding  
    **Type:** AFK  
    **Blocked by:** i18n foundation  
    **User stories covered:** US10

12. **Title:** End-to-end hardening and deployment pipeline  
    **Type:** AFK  
    **Blocked by:** Product slices complete  
    **User stories covered:** US11, regression coverage for US1–US9

### Tasks Proposal

#### Task 1 — Design inputs gate

**Goal**  
Ensure UI implementation has authoritative design inputs before visual work starts.

**In Scope**

- Confirm `docs/design/sticker-tracker.pen` exists.
- Confirm `/design-tokens/` exists with exported Pencil tokens.
- Confirm Style Dictionary input/output contract.
- Confirm token naming conventions for color, typography, spacing, radius, shadow.

**Dependencies**

- None.

**Acceptance Criteria**

- Pencil mockup path is available.
- Token files are available.
- UI implementation tasks are unblocked.
- Any missing design/token inputs are documented as blockers before UI work.

**Test Strategy**

- Validate files exist.
- Run token transform once after Style Dictionary setup exists.

**Risks or Notes**

- HITL slice. Requires designer/product input.
- No component styling should begin before this is complete.

#### Task 2 — Project foundation and quality tools

**Goal**  
Create baseline React 19 + TanStack Start SPA project with quality gates.

**In Scope**

- React 19 + TanStack Start SPA mode.
- TypeScript strict mode.
- pnpm scripts.
- oxlint, oxfmt, knip, stylelint.
- husky, lint-staged, commitlint.
- `pnpm complete-check` as single local QA command.

**Dependencies**

- None.

**Acceptance Criteria**

- App starts locally as client-only SPA.
- TypeScript strict mode enabled.
- `pnpm complete-check` runs lint, format check, typecheck, tests, and build hooks as available.
- No backend/server persistence introduced.

**Test Strategy**

- Run `pnpm complete-check`.
- Verify generated build is SPA-compatible.

**Risks or Notes**

- Do not lower existing or future Vitest coverage thresholds without approval.

#### Task 3 — Static album data and integrity tests

**Goal**  
Encode complete album structure from PDF as typed data.

**In Scope**

- Implement `/src/data/album.ts`.
- Define required album/page/sticker types.
- Encode exact page order.
- Encode all team pages, special pages, sticker identifiers, `albumCode`, and `flagCode`.
- Add album data integrity tests.

**Dependencies**

- Project foundation.

**Acceptance Criteria**

- 51 pages exist in correct order.
- 48 team pages exist.
- Every team has 20 stickers.
- FWC Opening has 9 stickers.
- FWC Closing has 11 stickers.
- Coca-Cola has 14 stickers.
- Album total is 994 stickers.
- Each group has 4 teams and 80 stickers.
- Every team has `albumCode`, `flagCode`, stable `pageId`, and translation key.

**Test Strategy**

- Vitest pure unit tests for counts, ordering, uniqueness, page IDs, sticker IDs, and group totals.

**Risks or Notes**

- Verify `flag-icons` compatibility for `gb-eng` and `gb-sct`.

#### Task 4 — Local collection persistence

**Goal**  
Persist collected sticker state and locale preference in IndexedDB via `idb`.

**In Scope**

- Typed IndexedDB wrapper.
- Collection read/write helpers.
- Locale preference read/write helpers.
- In-memory fallback on IndexedDB failure.
- Persistent warning toast state for storage fallback.
- Loading state support for initial read.

**Dependencies**

- Static album data.

**Acceptance Criteria**

- First launch shows empty collection.
- Toggling sticker writes immediately.
- Hard reload preserves collection state.
- Locale preference persists.
- IndexedDB failure falls back to in-memory and surfaces warning.

**Test Strategy**

- Vitest browser mode tests for IndexedDB helpers.
- Unit tests for collect/missing toggle cycle.
- Error-path tests with mocked IndexedDB failure.

**Risks or Notes**

- Use serializable arrays internally if `Set` cannot be persisted directly.

#### Task 5 — i18n foundation and locale switcher

**Goal**  
Ship full v1 translation setup for `pt-BR`, `es`, and `en`.

**In Scope**

- `react-i18next` setup.
- Locale files at `/src/locales/{locale}/translation.json`.
- Detection order: IndexedDB → `navigator.languages` → `en`.
- Locale switcher in header or settings.
- Scanner namespace scaffolded.
- Team/special/group/UI strings externalized.

**Dependencies**

- Static album data.
- Local persistence for saved preference.

**Acceptance Criteria**

- All visible UI strings use translation keys.
- Switching locale updates visible strings.
- Locale persists after reload.
- All three locale files have same key structure.
- `en` is fallback.

**Test Strategy**

- Unit test translation key parity across locale files.
- Playwright locale switch persistence test.

**Risks or Notes**

- Do not hardcode team names in components.

#### Task 6 — Album page viewer with sticker toggles

**Goal**  
Render team and special pages with design-token styling and working sticker toggles.

**In Scope**

- Full-screen page/card layout.
- Team header: translated team name, flag, group.
- Special page headers.
- Sticker grid for teams and special pages.
- Collected/missing visual states.
- Mini page progress.
- Loading skeleton/spinner during collection read.
- CSS Modules using only token custom properties.

**Dependencies**

- Design inputs gate.
- Static album data.
- Local collection persistence.
- i18n foundation.

**Acceptance Criteria**

- Every page renders with correct stickers.
- Tapping sticker toggles state and updates progress.
- State persists after reload.
- Layout follows Pencil mockups and token usage rules.
- Accessibility labels exist for sticker toggles.

**Test Strategy**

- Unit tests for page progress calculation.
- Component/browser tests for toggle UI.
- Playwright persistence after reload.
- stylelint validates no raw design values.

**Risks or Notes**

- UI blocked by missing Pencil/tokens.

#### Task 7 — Swipe navigation and quick picker

**Goal**  
Enable album-order navigation by swipe and direct picker.

**In Scope**

- Left/right swipe navigation.
- Wraparound navigation.
- Configurable swipe threshold constant.
- Touch handling that preserves vertical scrolling.
- Header quick navigation button.
- Slide-in panel/modal with album-order page list grouped by special/group.

**Dependencies**

- Album page viewer.

**Acceptance Criteria**

- Swipe follows exact album order.
- Last page swipes to first; first page swipes to last.
- Vertical grid scroll does not accidentally trigger swipe.
- Picker navigates to selected page and closes.
- Picker is keyboard accessible.

**Test Strategy**

- Unit tests for next/previous page logic.
- Playwright swipe/order test.
- Playwright quick picker sample navigation test.

**Risks or Notes**

- Lightweight gesture utility is allowed if documented.

#### Task 8 — Filter and progress summary

**Goal**  
Add collection filter and global summary screen.

**In Scope**

- Filter states: All, Collected, Missing.
- Persistent in-memory filter across page swipes.
- Empty state per page/filter.
- Global summary entry in header.
- Total, group, and special progress breakdowns.

**Dependencies**

- Album page viewer.

**Acceptance Criteria**

- Filter changes visible stickers correctly.
- Filter persists across swipes until changed.
- Empty states are translated.
- Summary totals are accurate for page, group, special, and album totals.

**Test Strategy**

- Unit tests for filter helpers across team/special pages.
- Unit tests for progress aggregation.
- Playwright filter propagation across pages.

**Risks or Notes**

- Hidden vs visually suppressed behavior must match Pencil design.

#### Task 9 — Share missing stickers PNG

**Goal**  
Generate and share/download a PNG of missing stickers.

**In Scope**

- Share entry on current page with page preselected.
- Global share entry with multi-select/all pages.
- Client-side PNG rendering via Canvas or documented `html2canvas` choice.
- Native Web Share API when available.
- Desktop PNG download fallback.
- Large selection safeguards.

**Dependencies**

- Album page viewer.
- Progress/filter helper functions.

**Acceptance Criteria**

- User can select one, multiple, or all pages.
- PNG includes selected page titles, flags for teams, group labels, and missing stickers.
- Mobile share path works when Web Share API supports files.
- Desktop fallback downloads PNG.
- Empty missing list renders clear translated message.

**Test Strategy**

- Unit tests for share data model.
- Unit tests for canvas generation with mocked canvas API.
- Playwright download interception for desktop fallback.

**Risks or Notes**

- Browser canvas max dimensions vary; renderer must avoid single oversized canvas failures.

#### Task 10 — PWA offline, install, and update flow

**Goal**  
Make app installable and reliable offline.

**In Scope**

- Vite PWA plugin config.
- Workbox offline precaching/runtime strategy.
- Web app manifest.
- Platform-aware install button/instructions.
- Service worker update toast with reload action.

**Dependencies**

- Project foundation.
- Album page viewer.

**Acceptance Criteria**

- App loads offline after first successful load.
- Install prompt behavior follows platform capabilities.
- Update toast appears when waiting service worker is available.
- Reload action activates update.
- No forced reload.

**Test Strategy**

- Playwright offline test.
- Playwright/service-worker harness for update toast.
- Build verification.

**Risks or Notes**

- PWA behavior differs across browsers; acceptance should target Chromium automation plus documented manual iOS checks.

#### Task 11 — Scanner Phase 2 scaffolding

**Goal**  
Prepare scanner architecture without shipping scanner functionality in v1.

**In Scope**

- `/src/features/scanner/README.md`.
- `/src/features/scanner/types.ts` with `ScanResult`.
- Scanner translations in all locale files.
- Feature flag with default off.
- Header slot/component hidden in production when flag off.

**Dependencies**

- i18n foundation.

**Acceptance Criteria**

- `ScanResult` is exported.
- Scanner namespace exists in all locales.
- Scanner dependencies are not added to initial bundle.
- No visible non-functional scan button in production v1.

**Test Strategy**

- Type export test.
- Translation key parity test.
- Bundle check confirms no OCR/ML dependency in v1.

**Risks or Notes**

- Do not implement camera scanning in v1.

#### Task 12 — End-to-end hardening and deployment pipeline

**Goal**  
Finalize CI/CD, E2E coverage, and Cloudflare deployment readiness.

**In Scope**

- GitHub Actions jobs:
  1. lint-format,
  2. typecheck,
  3. unit-tests,
  4. e2e-tests,
  5. build,
  6. deploy on `main` only.
- Wrangler deployment config.
- Required secrets documentation.
- Playwright coverage for critical flows.

**Dependencies**

- Product slices complete.

**Acceptance Criteria**

- CI runs jobs in required order.
- Deploy only runs on pushes to `main`.
- Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- E2E covers swipe order, persistence, filter, quick nav, share download, locale persistence, offline, and update toast.
- `pnpm complete-check` passes locally.

**Test Strategy**

- Run `pnpm complete-check`.
- Run GitHub Actions locally with Agent CI if configured.
- Validate Wrangler dry-run or non-production deploy flow if available.

**Risks or Notes**

- GitHub and Cloudflare credentials are environment responsibilities, not app code.

## Approval Gate

### Approved inputs

- User approved source PDF path: `docs/references/Planilha de figurinhas da copa.pdf`.
- User approved final PRD path: `docs/prd/world-cup-2026-sticker-album-tracker.md`.
- User approved clarified decisions listed above.

### Required before implementation

- Create Linear issues first, following project conventions.
- Check Linear dependencies before work starts.
- Do not begin UI implementation until Pencil file and `design-tokens/` are committed.
- Use approved stack decisions in this PRD.
- Use vertical slices above for implementation planning.

### Definition of done for v1

- All v1 functional requirements implemented.
- Scanner remains scaffolded only and hidden by default.
- App works offline after first load.
- All locale files complete for `pt-BR`, `es`, and `en`.
- Album data integrity tests pass against PDF-derived structure.
- `pnpm complete-check` passes.
- GitHub Actions pipeline passes.
- Cloudflare Workers deployment configured for `main`.

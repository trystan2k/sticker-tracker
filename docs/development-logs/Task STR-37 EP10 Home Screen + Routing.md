---
title: 'Task STR-37 EP10: Home Screen + Routing'
type: development-log
permalink: /development-logs/str-37-ep10-home-screen-routing
---

## Metadata

- Epic ID: STR-37
- Branch: feature/STR-37-ep10-home-screen-routing
- Project: sticker-tracker
- Date: 2026-05-12

## Objective

Implement EP10: Home Screen and Routing. Add album routing variants, wire navigation and swipe gestures to router, add Home screen hero progress and group/special cards, and header with drawer/locale switcher.

## Implementation Summary

### STR-38 — Routing Refactor

- Added routes: `/` (Home), parent `/album`, `/album/$pageId` (special), `/album/$group/$pageId` (team).
- Bare `/album` now redirects to `/`.
- Route helpers added in `viewer-state.ts`: `getAlbumPath()`, `getAlbumPageByRoute()`.
- Extracted shared `AlbumRouteScreen` component.
- Filter persistence implemented via module-level store using `useSyncExternalStore`.

### STR-39 — Wire Swipe to Router

- Converted `SwipeNavigator` into a controlled component accepting `activePageId` prop.
- Swipe gestures now call `useNavigate()` with canonical album URLs.
- `QuickNavigationPicker` navigates via the router.
- View Transitions preserved across navigation.

### STR-40 — Home Screen Hero Progress Ring

- Implemented SVG circular progress ring using `strokeDasharray`/`strokeDashoffset`.
- Progress uses real collection data from `AppStateContext`.
- Locale-aware formatting via `Intl.NumberFormat`.
- Added pure helper `computeHomeSummary()` in `home-state.ts`.

### STR-41 — Group Cards with Flag Images

- Added 12 group cards (A–L) derived from album data.
- Flag tiles loaded from `flagcdn.com` with error fallback handler.
- Clicking a group card navigates to team routes; styling differs for complete vs incomplete groups.

### STR-43 — Header with Hamburger Drawer

- 56px header with hamburger (opens locale switcher), centered title, and share stub.
- Reused existing `LocaleSwitcher` component.
- Added i18n keys for the header text.

### STR-42 — Special Page Cards

- Implemented 3 special cards (FWC Opening, FWC Closing, Coca-Cola).
- Coca-Cola card uses red accent design token.
- Special cards navigate to their respective special routes.

## Files Changed

Grouped by feature area (all paths under `src/`):

- routes/
  - album.tsx
  - index.tsx
  - album/\*.tsx
- components/album-viewer/
  - AlbumRouteScreen.tsx
  - SwipeNavigator.tsx
  - QuickNavigationPicker.tsx
  - viewer-state.ts
- components/home/
  - HomeScreen.tsx
  - HomeHeader.tsx
  - HomeHeroProgress.tsx
  - HomeGroupCards.tsx
  - HomeSpecialCards.tsx
  - home-state.ts
  - \*.module.css
- locales/
  - en/translation.json
  - es/translation.json
  - pt-BR/translation.json
- routeTree.gen.ts (generated)
- test/ (tests updated for routing context)

## Key Decisions

- Persist filters using a module-level store + `useSyncExternalStore` instead of React Context to avoid SSR timing issues.
- Reused `LocaleSwitcher` for drawer behavior rather than building a new drawer component.
- Implemented the home progress ring as an SVG (avoids adding a chart library).
- Kept pure helper functions in `home-state.ts` to separate data derivation from presentation.
- Converted `SwipeNavigator` to a controlled component to keep routing canonical and centralize navigation logic.

## Validation Performed

- Test files updated for routing context under `test/`.
- Route generation reflected in `routeTree.gen.ts`.
- Basic typechecks and linting expected in CI (not run here).

## Risks and Follow-ups

- Flag image external requests may need caching or local fallback for offline/slow networks.
- Add E2E tests for swipe/navigation transitions and view transitions.
- Accessibility audit for header/drawer and keyboard navigation of album pages.
- Consider extracting route-path helpers to a shared util if routing grows further.

## References

- Branch: feature/STR-37-ep10-home-screen-routing
- Related issues: STR-38, STR-39, STR-40, STR-41, STR-42, STR-43

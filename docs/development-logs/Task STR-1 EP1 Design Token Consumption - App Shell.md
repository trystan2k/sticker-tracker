---
title: 'EP1: Design Token Consumption + App Shell (STR-1)'
type: development-log
permalink: /development-logs/str-1-ep1-design-tokens-app-shell
---

Metadata

- Task ID: STR-1
- Epic: EP1: Design Token Consumption + App Shell
- Related Tasks: STR-10, STR-11, STR-12
- Branch: feature/STR-1-design-token-consumption-app-shell
- PR: https://github.com/trystan2k/sticker-tracker/pull/8
- Project: sticker-tracker
- Date: 2026-05-10

Objective

- Implement design token CSS consumption and a minimal App Shell to host the product UI. Provide locale switcher UI and ensure correct TanStack Start hydration using shellComponent.

Implementation Summary

- STR-10: Imported three design token CSS files (primitives, semantic, components) into src/styles.css using url() notation. Added global token-backed defaults: background, color, font-family, color-scheme, form inheritance. Resolved stylelint complaints (duplicate selectors, import-notation).
- STR-11: Implemented AppShell component providing header, main, nav, overlay, toast regions. Extracted LocaleSwitcher from index.tsx into a dedicated component and styles. Updated src/routes/\_\_root.tsx to use shellComponent pattern for TanStack Start root to ensure hydration scripts render. Fixed SPA hydration bug caused by using component instead of shellComponent which omitted hydration scripts and left app stuck on "Loading app state...". Updated public/manifest.json with product metadata. Added browser tests and updated E2E tests to reflect shell structure.
- STR-12: LocaleSwitcher implemented as part of STR-11. Kept native select element to minimize complexity. Reused AppStateContext.setLocale and existing i18n resources.

Files Changed

- src/styles.css
- src/routes/\_\_root.tsx
- src/routes/index.tsx
- src/components/AppShell.tsx
- src/components/AppShell.module.css
- src/components/LocaleSwitcher.tsx
- src/components/LocaleSwitcher.module.css
- public/manifest.json
- test/components/AppShell.browser.test.tsx
- test/components/LocaleSwitcher.browser.test.tsx
- test/components/RootRoute.browser.test.tsx
- test/components/Home.browser.test.tsx
- e2e/welcome-message.test.ts
- e2e/locale-persistence.test.ts

Key Decisions

- Use shellComponent (not component) for TanStack Start root so hydration scripts are emitted and client hydration succeeds. Rationale: component omitted hydration scripts, producing a non-hydrating SPA and leaving app stuck at loading state.
- Keep LocaleSwitcher as native select to reduce complexity and accessibility surface area.
- Keep AppShell dumb: no added global state/reducer/provider; AppShell provides regions only.
- Reuse existing AppStateContext.setLocale and i18n resources to avoid duplicating locale logic.

Validation Performed

- pnpm complete-check passed (knip + typecheck + lint + format + test + e2e + build).
- Coverage: statements >=83%, branches >=72%.
- Browser tests added/updated for AppShell, LocaleSwitcher, RootRoute, Home.
- E2E tests updated: welcome-message and locale-persistence validated.
- Manual verification: confirmed hydration bug fixed by switching to shellComponent; app no longer stuck on "Loading app state..." and hydration scripts present in HTML output.

Risks and Follow-ups

- Risk: Token CSS files loaded via url() assume correct public path in production — verify asset pipeline and base path for CDN or hosted assets in CI/CD.
- Follow-up: Consider progressively enhancing LocaleSwitcher with accessible custom UI if UX requires it; preserve native select as fallback.
- Follow-up: Add visual regression checks for AppShell layout across breakpoints.

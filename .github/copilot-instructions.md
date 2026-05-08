# Copilot Repository Instructions — Sticker Tracker

These instructions onboard AI agents to this repository with accurate build, test, and validation guidance. Keep responses aligned with the stack and conventions below to minimize CI failures and rework.

## High-Level Summary

- Mobile-first, client-only Sticker score tracker.
- Stack: React 19, TanStack Start (Router + SPA prerender), Vite 7, TypeScript 6, CSS Modules, Base UI.
- Testing: Vitest (unit + real Chromium via Playwright), optional Playwright e2e.
- Lint/Format: Oxlint, Stylelint, Oxfmt. Git hooks via Husky + lint-staged.
- CI/CD: GitHub Actions for verification and releases; Cloudflare Pages for previews and production (SPA).

Repository size: medium; primary app code in `src/`, tests in `test/`, build config in `vite.config.ts` and `vitest.config.ts`.

## Environment & Tooling

- Node: 26.x (see `mise.toml`)
- pnpm: 11.x (set in `package.json` → `packageManager`; CI uses this)
- Browsers (tests): Chromium via Playwright
  - If browser tests report missing binaries: `pnpm exec playwright install chromium`
- Dev server: Vite on port `4000` with `strictPort: true`

## Bootstrap

1. Install deps:
   - `pnpm install`
2. Ensure Playwright browser available (optional for unit-only runs):
   - `pnpm exec playwright install chromium`
3. Design tokens are generated automatically by `predev`/`prebuild` and `pretest`. To build explicitly:
   - `pnpm tokens:build`

## Run

- Start dev server:
  - `pnpm dev`
- Expected: Vite dev server on port 4000. If the port is in use, stop the conflicting process (strictPort).

## Build

- Production build:
  - `pnpm build`
- Output:
  - Client bundle: `dist/client`
  - SSR bundle: `dist/server`
  - SPA prerender: root route (`/`) is prerendered
- Notes:
  - Large-chunk warnings are acceptable; CI passes with current chunk sizes.

## Tests

- Combined unit + browser coverage (80% thresholds across maintained files):
  - `pnpm test`
- Watch mode:
  - `pnpm test:watch`
- Project layout:
  - Unit (Node): `test/**/*.test.{ts,tsx}`
  - Browser (Chromium via Playwright): `test/**/*.browser.test.{ts,tsx}`
- End-to-end Playwright suite (optional):
  - `pnpm test:e2e` (headless)
  - `pnpm test:e2e:headed` or `pnpm test:e2e:ui`
- Preconditions:
  - Run `pnpm exec playwright install chromium` once if browser tests fail due to missing binaries.

## Lint, Format, Typecheck

- Typecheck:
  - `pnpm typecheck` (tsc `--noEmit`)
- Lint:
  - `pnpm lint` (Oxlint `--deny-warnings` + CSS Stylelint)
  - Warning-denial means even minor warnings fail the command; use the fix variant locally:
    - `pnpm lint:fix`
- Format:
  - `pnpm format` to apply Oxfmt
  - `pnpm format:check` for non-mutating check

## Full Local Verification

- One-shot local gate:
  - `pnpm complete-check`
- Sequence executed:
  - `pnpm typecheck` → `pnpm lint:fix` → `pnpm format` → `pnpm test` → `pnpm test:e2e` → `pnpm build`
- Note:
  - This command is mutating (applies lint and format fixes). CI uses non-mutating checks.

## CI Workflows (Reference)

- `.github/workflows/ci.yml`: classification-first CI
  - For code changes: `pnpm typecheck` → `pnpm lint` → `pnpm format:check` → `pnpm test` → `pnpm build`
  - For docs-only changes: reduced path
- Release automation: Release Please (`release.yml`), preview deploy to Cloudflare Pages for the release PR, production deploy gated by published GitHub releases.

## Conventions & Rules

- React 19 + TanStack Start only; use TanStack Router navigation and loaders; do not use `window.location.href` for SPA navigation.
- UI:
  - Follow Pencil designs strictly; use design tokens from `design-tokens/` (generated to `design-tokens/dist/variables.css`).
  - CSS Modules for scoped styling; avoid global styles beyond `src/styles.css`.
  - Accessibility: prefer Base UI primitives; ensure keyboard nav, ARIA, focus management.
- File naming:
  - Components: `PascalCase.tsx` with `PascalCase.module.css`
  - Non-component modules: `kebab-case.ts`
  - Tests mirror the module/component structure and use `.test.tsx` or `.browser.test.tsx`.
- Imports:
  - Path aliases: `@/*` → `src/*`, `@test/*` → `test/*` (see `tsconfig.json`)
- Branch/commit:
  - Branch: `feature/[linear-issue-id]-[title]` (e.g., `feature/PBW-123-score-engine`)
  - Commit: `type: description` (feat/fix/docs/style/refactor/test/chore)

## Troubleshooting

- Lint failing due to warnings:
  - Use `pnpm lint:fix` locally; CI runs `pnpm lint` with denial and will fail on warnings.
- Browser tests failing:
  - Install Chromium: `pnpm exec playwright install chromium`
- Dev port conflict (4000):
  - Stop the other process; server uses `strictPort`.
- Missing design tokens:
  - Run `pnpm tokens:build` or any script with its pre-step (`predev`, `prebuild`, `pretest`).

## Agent Guidance

- Always validate with local gates before proposing changes:
  - At minimum run: `pnpm typecheck`, `pnpm format:check`, `pnpm test`, `pnpm build`
  - Prefer running `pnpm complete-check` when feasible
- Keep changes small and align with architecture:
  - Pure domain logic in `src/core/...`
  - Routing and shells under `src/routes` and `src/router.tsx`
  - UI components under `src/components`, scoped CSS Modules
- Load and apply accessibility and modern React patterns when working on UI.
- Never commit secrets; avoid introducing environment-dependent behavior into client-only code.

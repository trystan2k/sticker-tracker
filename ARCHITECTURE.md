# ARCHITECTURE.md

## 1. High-Level Architecture

Sticker Tracker is a client-only **TanStack Start** application built on **Vite** and **React 19**. The app uses TanStack Start file-based routes for the shell, **Base UI** for accessible primitives, and TypeScript domain modules.

Local state and user data are persisted via **IndexedDB** through a typed storage adapter. Internationalisation is provided by **react-i18next** with static JSON translation resources for `en`, `es`, and `pt-BR`.

Delivery automation is handled by **GitHub Actions**, **Release Please**, and **Cloudflare Pages**. Pull requests and `main` pushes flow through explicit CI checks, the Release Please release PR is the only branch that receives a preview deployment, and production deploys are gated by published GitHub releases. Dependabot keeps dependencies up to date and its PRs are auto-merged by a dedicated workflow.

Automated testing runs at three levels:

- **Unit** — Node-based Vitest tests for pure TypeScript modules.
- **Browser** — Real-browser Vitest tests backed by headless Chromium through Playwright.
- **E2E** — Full Playwright test suite targeting the running dev server.

## 2. Directory Structure

### 2.1 File Naming Conventions

- React component files use `PascalCase` (for example, `AppStateProvider.tsx`).
- Component test files mirror the component name in `PascalCase` and keep the test suffix (for example, `AppStateProvider.browser.test.tsx`).
- General TypeScript modules that are not React components use `kebab-case` (for example, `app-storage.ts`, `locale-service.ts`).
- Component-scoped CSS Modules use the same `PascalCase` basename as the component they style (for example, `AppShell.module.css`).
- Global or shared stylesheet files use `kebab-case` unless they intentionally match a colocated component.

```text
├── .github/
│   ├── dependabot.yml                          # Dependabot dependency update config
│   ├── copilot-instructions.md                 # Copilot review instructions
│   └── workflows/
│       ├── ci.yml                              # PR/main verification with docs-only routing
│       ├── release.yml                         # Release Please automation
│       ├── preview-release-pr.yml              # Release PR-only Cloudflare Pages preview deploy
│       ├── deploy-production.yml               # Release-gated production deploy
│       └── enable-automerge-dependabot.yml     # Auto-merges approved Dependabot PRs
├── .husky/                                     # Git hooks
│   ├── commit-msg                              # Enforces Conventional Commits via commitlint
│   ├── pre-commit                              # Runs staged-file quality checks through lint-staged
│   └── pre-push                               # Runs full check before push
├── design-tokens/                              # Style Dictionary design token source and output
│   ├── primitives/                             # Primitive token JSON files
│   ├── semantic/                               # Semantic token JSON files
│   ├── components/                             # Component-level token JSON files
│   ├── dist/                                   # Built CSS custom property files
│   │   ├── primitives.css
│   │   ├── semantic.css
│   │   └── components.css
│   └── style-dictionary.config.js              # Style Dictionary build config
├── docs/                                       # Planning and project documentation
├── e2e/                                        # Playwright end-to-end tests
│   ├── locale-persistence.test.ts
│   └── welcome-message.test.ts
├── public/                                     # Static assets served as-is
│   ├── favicon.ico
│   ├── manifest.json
│   ├── logo192.png
│   ├── logo512.png
│   └── robots.txt
├── src/
│   ├── components/                             # Shared React UI components
│   ├── data/
│   │   └── album.ts                            # Album domain model and static dataset
│   ├── i18n/
│   │   └── config.ts                           # i18next initialisation and locale switching
│   ├── lib/
│   │   └── storage/
│   │       └── app-storage.ts                  # Typed IndexedDB adapter
│   ├── locales/                                # Translation JSON resources
│   │   ├── en/translation.json
│   │   ├── es/translation.json
│   │   └── pt-BR/translation.json
│   ├── providers/
│   │   └── AppStateProvider.tsx                # App-wide state context and bootstrap logic
│   ├── routes/
│   │   ├── __root.tsx                          # Document shell and global stylesheet link
│   │   └── index.tsx                           # Home route
│   ├── services/
│   │   ├── collection-service.ts               # Sticker collection read/write/toggle logic
│   │   └── locale-service.ts                   # Locale resolution and persistence logic
│   ├── routeTree.gen.ts                        # Generated TanStack route tree
│   ├── router.tsx                              # Router factory and registration
│   └── styles.css                              # Global app styles
├── test/
│   ├── components/                             # Component unit/browser tests
│   ├── data/
│   │   └── album.test.ts                       # Album domain integrity tests
│   ├── i18n/
│   │   ├── config.test.ts                      # i18n config unit tests
│   │   └── translation-resources.test.ts       # Translation key alignment tests
│   ├── providers/
│   │   └── AppStateProvider.browser.test.tsx   # AppStateProvider browser tests
│   ├── services/
│   │   ├── collection-service.test.ts          # Collection service unit tests
│   │   └── locale-service.test.ts              # Locale service unit tests
│   ├── setup/
│   │   ├── browser.ts                          # Browser-mode setup entrypoint
│   │   └── shared.ts                           # Shared Vitest cleanup/reset hooks
│   └── storage/
│       └── app-storage.browser.test.ts         # IndexedDB adapter browser tests
├── .editorconfig
├── .lintstagedrc.json                          # Staged-file local quality tasks
├── .npmrc
├── .oxlintrc.json                              # Linting rules
├── .oxfmtrc.json                               # Formatting rules
├── .stylelintrc.json                           # CSS Module linting rules
├── CHANGELOG.md                                # Release Please-managed changelog
├── commitlint.config.js                        # Conventional Commits enforcement config
├── knip.json                                   # Unused exports/dependencies config
├── mise.toml                                   # Tool version management
├── package.json                                # Scripts and dependencies
├── playwright.config.ts                        # Playwright E2E suite config
├── pnpm-workspace.yaml                         # pnpm workspace config
├── release-please-config.json                  # Release Please package/release settings
├── release-please-manifest.json                # Release Please version state
├── tsconfig.json                               # TypeScript compiler config
├── vite.config.ts                              # App build/runtime config
└── vitest.config.ts                            # Vitest projects and coverage config
```

## 3. Application Structure

### 3.1 App Shell and Routing

- `src/routes/__root.tsx` defines the HTML document shell, metadata, global stylesheet loading, and wraps the app in `AppStateProvider`.
- `src/routes/index.tsx` is the current entry route.
- `src/router.tsx` creates the TanStack Router instance and registers the generated route tree.

### 3.2 State and Bootstrap

- `src/providers/AppStateProvider.tsx` bootstraps the app on mount: initialises IndexedDB storage, resolves and persists the locale, loads the sticker collection, and initialises i18next. It exposes `AppStateContext` with render state, locale, collection, and actions (`setLocale`, `toggleCollected`, `retryBootstrap`). On unrecoverable storage failure it offers a data-reset flow.

### 3.3 Storage Layer

- `src/lib/storage/app-storage.ts` is the sole IndexedDB adapter. It manages a single object store keyed by `'collection' | 'locale'`, classifies repeated failures as `unavailable` → `unrecoverable`, and exposes `initializeStorage`, `read`, `write`, and `resetAllData`. Test helpers (`setStorageDriverForTests`, `setDatabaseNameForTests`, `resetStorageStateForTests`) allow injecting mock drivers and unique DB names per test.

### 3.4 Services

- `src/services/locale-service.ts` — resolves the active locale with precedence `saved → navigator.languages → navigator.language → en`, persists selections, and exposes the `SUPPORTED_LOCALES` list.
- `src/services/collection-service.ts` — loads and hydrates the persisted collection state (null → empty object), and toggles individual stickers with immediate persistence.

### 3.5 Internationalisation

- `src/i18n/config.ts` initialises react-i18next with the resolved locale and static JSON resources. `initializeI18n` is idempotent (reuses the existing instance on repeat calls). `changeLocale` persists and switches the active language.
- `src/locales/{en,es,pt-BR}/translation.json` — translation resource files per supported locale.

### 3.6 Album Domain

- `src/data/album.ts` defines the album data model, branded identifier types, and the full static FIFA 2026 album dataset (51 pages, 994 stickers).

## 4. Testing Architecture

### 4.1 Vitest Configuration

`vitest.config.ts` merges the main `vite.config.ts` so tests inherit the same plugin stack and path alias behavior as the app.

- The `unit` project runs in the Node environment and targets `test/**/*.test.ts` and `test/**/*.test.tsx` while excluding browser-mode files.
- The `browser` project targets `test/**/*.browser.test.ts` and `test/**/*.browser.test.tsx` and runs in headless Chromium through Playwright.
- Coverage uses Vitest's V8 provider with text and HTML reporters.
- Coverage excludes `src/routeTree.gen.ts` and `src/start.ts` (generated/framework files).
- Coverage thresholds are set at **70%** for lines, branches, functions, and statements across `src/**/*.ts` and `src/**/*.tsx`.

### 4.2 Browser-Mode Tests

- `test/setup/shared.ts` restores mocks, unstubs globals and env vars, and clears the document body between tests.
- `test/setup/browser.ts` extends the shared setup for browser-mode suites.
- Browser tests for the IndexedDB adapter use unique DB names per test (via `setDatabaseNameForTests`) to avoid IDB `deleteDatabase` blocking between tests.

### 4.3 E2E Tests

- `playwright.config.ts` configures the full Playwright suite targeting a local dev server.
- `e2e/` contains full user-flow tests (locale persistence, welcome screen rendering).
- E2E runs as a separate `pnpm test:e2e` command and is included in `pnpm complete-check`.

## 5. Automation Architecture

- `.github/workflows/ci.yml` is the authoritative verification workflow. It classifies changes first, runs the reduced docs-only path only for `docs/**`, root markdown, and `.github/**/*.md`, and otherwise runs `pnpm typecheck` -> `pnpm lint` -> `pnpm format:check` -> `pnpm test` -> `pnpm build` in order.
- `.github/workflows/release.yml` runs Release Please on `main` so semantic versioning, changelog generation, and the release PR stay aligned with Conventional Commits.
- `.github/workflows/preview-release-pr.yml` rebuilds and deploys only the Release Please PR to a stable preview alias on Cloudflare Pages using `dist/client`.
- `.github/workflows/deploy-production.yml` rebuilds the published release tag and deploys the `dist/client` artifact to the production Pages branch.
- `.github/workflows/enable-automerge-dependabot.yml` automatically approves and enables auto-merge for Dependabot PRs.
- `.github/dependabot.yml` configures Dependabot for automated dependency updates.

## 6. Developer Workflow

The local developer workflow is:

1. Install dependencies with `pnpm install`.
2. Start the app with `pnpm dev`.
3. Run `pnpm test` for the combined Vitest unit + browser suite, or `pnpm test:watch` for local iteration.
4. Run `pnpm test:e2e` for the full Playwright E2E suite.
5. Run `pnpm lint` for `oxlint --deny-warnings` plus CSS Module Stylelint checks, or `pnpm lint:fix` to apply fixes.
6. Use `pnpm format` to apply Oxfmt or `pnpm format:check` for a non-mutating formatting check.
7. Use `pnpm run complete-check` for the repo's local verification flow; note that this command may modify files (it runs `lint:fix` and `format`) and is not used by CI.
8. If the browser suite reports missing Playwright binaries, run `pnpm exec playwright install chromium` once and retry.

Pre-commit hooks are installed through Husky:

- `commit-msg` enforces Conventional Commits format via `commitlint`.
- `pre-commit` runs `lint-staged`, which reads `.lintstagedrc.json` to scope Oxlint, CSS Module Stylelint, and Oxfmt to staged files only.
- `pre-push` runs additional checks before push.

## 7. Design System

All app screens MUST be developed following the Pencil design file strictly. The design tokens and visual specifications are defined in the Pencil design file at `docs/design/sticker-tracker.pen`.

### 7.1 Design Tokens

Design tokens are defined in `design-tokens/` and built by Style Dictionary into CSS custom property files in `design-tokens/dist/`:

- `primitives.css` — raw values (colors, spacing, typography scales).
- `semantic.css` — purpose-mapped tokens (e.g. `--color-background`, `--color-text-primary`).
- `components.css` — component-specific tokens (filter-chip, header, progress, sticker).

Run `pnpm tokens:build` to regenerate the `dist/` files from source JSON.

### 7.2 Design Implementation

When implementing UI screens:

1. Open the Pencil design file to reference the exact layout, spacing, and visual specifications.
2. Use design tokens from `design-tokens/dist/*.css` instead of hardcoded values.
3. Match colors, typography, spacing, and component styling exactly as shown in the design.
4. Verify implementation matches the design visually before considering the task complete.

### 7.3 Accessing Design Variables in Code

Import the relevant CSS file from `design-tokens/dist/` (already included via global styles) and reference the CSS custom properties directly (e.g. `var(--color-background)`). Always prioritize the Pencil design as the single source of truth for visual implementation.

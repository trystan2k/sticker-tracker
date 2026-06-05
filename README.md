# Sticker Tracker

A mobile-first, client-only sticker tracker application for tracking collected and missing stickers in your album. Built with React 19, TanStack Start, and deployed to Cloudflare Pages.

## Tech Stack

| Category                 | Technology                                    |
| ------------------------ | --------------------------------------------- |
| **Framework**            | React 19, TanStack Start (SPA mode)           |
| **Routing**              | @tanstack/react-router                        |
| **Styling**              | CSS Modules, Style Dictionary (design tokens) |
| **Internationalization** | i18next, react-i18next                        |
| **State Management**     | React Context + idb (IndexedDB)               |
| **OCR**                  | Tesseract.js                                  |
| **Analytics**            | Mixpanel (client-side, consent-based)         |
| **Testing**              | Vitest (unit), Playwright (E2E)               |
| **Linting**              | Oxlint, Stylelint                             |
| **Formatting**           | Oxfmt                                         |
| **Build Tool**           | Vite 8                                        |
| **Package Manager**      | pnpm 11                                       |
| **Deployment**           | Cloudflare Pages                              |
| **CI/CD**                | GitHub Actions                                |

## Requirements

- **Node.js** ^24.14.1
- **pnpm** ^11.0.8

## Setup

```bash
# Clone the repository
git clone https://github.com/your-org/sticker-tracker.git
cd sticker-tracker

# Install dependencies
pnpm install

# Build design tokens (required before dev/build)
pnpm tokens:build
```

## Development

### Start Development Server

```bash
pnpm dev
```

Runs Vite dev server on **http://localhost:4000** with HMR. The `predev` script automatically builds design tokens and syncs OCR assets before starting.

### Available Scripts

| Script                 | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`             | Start development server (port 4000)                                       |
| `pnpm build`           | Production build (outputs to `dist/client`)                                |
| `pnpm preview:e2e`     | Build + preview production build locally (port 4000)                       |
| `pnpm tokens:build`    | Compile design tokens from Style Dictionary                                |
| `pnpm typecheck`       | Run TypeScript type checking (no emit)                                     |
| `pnpm lint`            | Run Oxlint + Stylelint                                                     |
| `pnpm lint:fix`        | Auto-fix linting issues                                                    |
| `pnpm format`          | Format code with Oxfmt                                                     |
| `pnpm format:check`    | Check formatting without changes                                           |
| `pnpm test`            | Run unit tests with coverage (Vitest)                                      |
| `pnpm test:watch`      | Run tests in watch mode with coverage                                      |
| `pnpm test:e2e`        | Run E2E tests (Playwright)                                                 |
| `pnpm test:e2e:ui`     | Run E2E tests with Playwright UI                                           |
| `pnpm test:e2e:headed` | Run E2E tests in headed mode                                               |
| `pnpm knip`            | Check for unused dependencies                                              |
| `pnpm knip:fix`        | Auto-fix unused dependencies                                               |
| `pnpm complete-check`  | Full CI pipeline locally (knip, typecheck, lint, format, test, e2e, build) |

## Testing

### Unit Tests (Vitest)

```bash
# Run once with coverage
pnpm test

# Watch mode with coverage
pnpm test:watch
```

Coverage thresholds are enforced. Reports output to `coverage/`.

### E2E Tests (Playwright)

```bash
# Run headless (CI mode)
pnpm test:e2e

# Interactive UI
pnpm test:e2e:ui

# Headed browser
pnpm test:e2e:headed
```

Tests run against Chromium and WebKit. Reports output to `playwright-report/`.

## Deployment

### Production

**URL:** https://sticker-tracker.pages.dev

Deployed automatically via GitHub Actions when a release is created:

1. **Release Please** creates a release PR based on conventional commits
2. On merge to `main`, Release Please creates a GitHub Release + tag
3. **Build and Upload** job builds the app and uploads `dist.tar.gz` to the release
4. **Deploy Production** workflow downloads the artifact and deploys to Cloudflare Pages

### Preview Deployments

Release Please PRs get automatic preview deployments to Cloudflare Pages (branch: `release-please-main`). Preview URLs are posted as comments on the PR.

### Manual Deploy

```bash
# Build production
pnpm build

# Deploy to Cloudflare Pages (requires wrangler auth)
pnpm exec wrangler pages deploy dist/client --project-name=sticker-tracker --branch=main
```

## CI/CD Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every PR and push to `main`:

1. **Detect Changes** - Classifies if changes are docs-only
2. **Docs Checks** (docs-only) - Format check only
3. **Full Checks** (code changes):
   - Knip (unused deps)
   - TypeScript type check
   - Oxlint + Stylelint
   - Oxfmt format check
   - Unit tests (Vitest + coverage)
   - Production build
4. **E2E Tests** - Runs on release-please and dependabot PRs
5. **CI Gate** - Aggregates all job results

### Release Workflow (`.github/workflows/release.yml`)

Triggered after successful CI on `main`:

1. **Release Please** - Creates release PR/release based on commit history
2. **Build & Upload** - Builds at release tag, uploads `dist.tar.gz` to GitHub Release
3. **Deploy Production** - Calls reusable deploy workflow

### Deploy Workflow (`.github/workflows/deploy-production.yml`)

Reusable workflow called by release:

- Downloads `dist.tar.gz` from GitHub Release
- Extracts and deploys `dist/client` to Cloudflare Pages
- Sets production environment URL

## Project Structure

```
├── .github/workflows/     # GitHub Actions CI/CD
├── design-tokens/         # Style Dictionary design tokens
├── public/                # Static assets
├── scripts/               # Build scripts (tokens, SW, OCR sync)
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── providers/         # Context providers (AppState, I18n, Analytics)
│   ├── routes/            # TanStack Router routes (file-based)
│   ├── services/          # Business logic (analytics, storage, OCR)
│   ├── styles/            # Global CSS, CSS Modules
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── tests/                 # Test utilities, setup
├── e2e/                   # Playwright E2E tests
├── vite.config.ts         # Vite + TanStack Start config
└── package.json
```

## Design System

Design tokens defined in `design-tokens/` and compiled via Style Dictionary:

```bash
pnpm tokens:build
```

Tokens output to `design-tokens/dist/*.css` as CSS custom properties. **Always use tokens** — never hardcode colors, spacing, typography, or radii.

## Internationalization

All user-facing strings go through i18next. Translation files in `src/locales/`. Use `useTranslation()` hook in components.

## Analytics

Mixpanel initialized only after user consent via `src/services/analytics-service.ts`. Events defined in `AGENTS.md`.

## License

Private — internal use only.

# Release Process

This repository uses `Release Please` plus GitHub Actions to automate versioning, changelog updates, release previews, and production deployments.

## Overview

1. Changes merge into `main` using Conventional Commit style messages.
2. The `Release Please` workflow runs on pushes to `main`.
3. Release Please evaluates releasable commits and opens or updates a release PR.
4. Only that release PR receives a Cloudflare Pages preview deployment.
5. When the release PR is merged, Release Please publishes a GitHub release.
6. The published release triggers the production deployment workflow.

## Commit Types That Trigger Releases

Release Please follows the Node release strategy configured for this repo.

- Non-breaking releasable commit types: `feat`, `fix`, `chore(deps)`
- Breaking changes still trigger major releases, for example `feat!:` or `refactor!:`
- Non-releasable changes such as docs-only or chore-only commits do not create a release by themselves

## Workflow Sequence

### 1. Continuous Integration

`CI` runs on pull requests and pushes to `main`.

- Full verification order is:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `pnpm test`
  - `pnpm build`
- Docs-only changes take a reduced path and run `pnpm format:check`
- Superseded runs are cancelled automatically

The main CI workflow lives at `.github/workflows/ci.yml`.

### 2. Release Please

The release workflow lives at `.github/workflows/release.yml` and runs on every push to `main`.

It does the following:

- inspects commits on `main`
- updates or creates the release PR when a release is needed
- updates version metadata
- maintains `CHANGELOG.md`
- publishes the GitHub release after the release PR is merged

This workflow uses the `RELEASE_PLEASE_TOKEN` secret so the release PR and published release can trigger downstream workflows.

### 3. Release PR Preview Deployment

The preview workflow lives at `.github/workflows/preview-release-pr.yml`.

It only runs for the Release Please branch:

- branch name: `release-please--branches--main`
- event: release PR opened, reopened, or synchronized

It performs the full verification path again and deploys `dist/client` as a stable preview to Cloudflare Pages.

Important:

- normal feature PRs do not get preview deployments
- only the Release Please PR gets a preview deployment
- the workflow comments the preview URL back onto the release PR

### 4. Production Deployment

The production deployment workflow lives at `.github/workflows/deploy-production.yml`.

It runs only when GitHub receives a published release event, and only when that release targets `main`.

The workflow:

- checks out the released tag
- re-runs the verification pipeline
- builds the app
- deploys `dist/client` to the production Cloudflare Pages branch alias

Production is not deployed on every push to `main`.

## Pages Artifact

This repo deploys `dist/client` directly to Cloudflare Pages.

Why:

- `pnpm build` produces the Pages-ready SPA output in `dist/client`
- `dist/server` is not part of the static Pages deployment payload
- using `dist/client` directly keeps the workflows simpler and avoids extra packaging logic

## Capacitor Native Wrappers

The repository also contains Capacitor native wrappers under `android/` and `ios/`.

Important:

- GitHub release and Cloudflare Pages deployment only publish the web app artifact from `dist/client`
- Capacitor native projects are not built or distributed by the Pages release flow
- Native wrappers must be refreshed manually from the current web build with `pnpm cap:sync`, `pnpm cap:sync:android`, or `pnpm cap:sync:ios`
- Native debugging/opening is done locally with `pnpm cap:open:android` and `pnpm cap:open:ios`

## Required Secrets

GitHub Actions requires these secrets:

- `RELEASE_PLEASE_TOKEN` - token used by Release Please so downstream workflows can be triggered
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token for Pages deployments
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- `CLOUDFLARE_PAGES_PROJECT_NAME` - Pages project name used for preview and production deploys

## What Maintainers Need To Do

In the normal flow, maintainers do not manually version or deploy the app.

Typical process:

1. Merge releasable work into `main`.
2. Wait for Release Please to open or update the release PR.
3. Review the release PR, including the preview deployment URL.
4. Merge the release PR when it is ready.
5. Confirm the GitHub release is published and the production deploy succeeds.

## Troubleshooting

- If no release PR appears after merging work to `main`, verify the merged commits use releasable Conventional Commit types.
- If the release PR appears but no preview is deployed, verify the PR branch is `release-please--branches--main` and confirm required secrets are set.
- If the GitHub release is published but production does not deploy, inspect `.github/workflows/deploy-production.yml` and confirm the release targets `main`.
- If deployment fails, confirm `pnpm build` still emits the expected `dist/client` output and that the Pages workflows still deploy that directory.

For incident handling and rollback policy, see `docs/prd/release-incident-runbook.md`.

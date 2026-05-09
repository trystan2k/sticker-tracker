---
name: husky
description: "Use when setting up, configuring, or troubleshooting Husky git hooks in a Node.js project. Covers installation, hook creation, Husky v8 vs v9 differences, prepare script setup, and common hook patterns (pre-commit, commit-msg, pre-push)."
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://typicode.github.io/husky/
    - https://typicode.github.io/husky/get-started.html
    - https://typicode.github.io/husky/how-to.html
    - https://typicode.github.io/husky/troubleshooting.html
---

# Husky Specialist

## Mission

Install and maintain [Husky](https://typicode.github.io/husky/) git hooks in Node.js projects. Ensure hooks are correctly created, executable, and automatically installed for all contributors via the `prepare` lifecycle script.

---

## When to Use

Activate this skill for any of the following:

- Installing Husky in a new or existing Node.js project
- Creating or modifying git hooks (`pre-commit`, `commit-msg`, `pre-push`, etc.)
- Debugging hooks that are not running or are being skipped
- Migrating from Husky v8 to v9
- Setting up per-contributor hook auto-install via `prepare`
- Disabling hooks temporarily (CI environments, emergency bypasses)

---

## ⚠️ Husky v8 vs v9 — Critical Differences

| Aspect | v8 | v9 |
|--------|----|----|
| Install command | `npx husky install` | `npx husky init` |
| `prepare` script | `"prepare": "husky install"` | `"prepare": "husky"` |
| Hook file format | Shell scripts in `.husky/` | Shell scripts in `.husky/` (same) |
| Auto-init | No | `npx husky init` sets up `prepare` automatically |
| Minimum Node | 16 | 18 |

**Always use v9 for new projects.** The task description may reference v8 commands — use v9 equivalents.

---

## Installation

### Install the package

```bash
npm install --save-dev husky
```

### Initialise Husky (v9)

```bash
npx husky init
```

This command:
1. Creates the `.husky/` directory
2. Creates a sample `.husky/pre-commit` hook
3. Adds `"prepare": "husky"` to `package.json` scripts automatically

### Verify `package.json` after init

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

The `prepare` script ensures hooks are (re-)installed whenever any contributor runs `npm install`.

---

## Creating Hooks

All hooks are shell scripts placed in the `.husky/` directory. They **must be executable**.

### Creating a hook manually

```bash
# Create the hook file
echo 'npx lint-staged' > .husky/pre-commit

# Make it executable
chmod +x .husky/pre-commit
```

Or use the Husky CLI (v9):

```bash
echo 'npx lint-staged' >> .husky/pre-commit
```

### Hook file format

Hooks are plain shell scripts. The first line should be a valid shell command:

```sh
npx lint-staged
```

No shebang line is required in Husky v9 (it uses `sh` by default). Add `#!/bin/sh` explicitly if your environment requires it.

---

## Common Hook Patterns

### `pre-commit` — run linters on staged files

```sh
npx lint-staged
```

Pairs with lint-staged to run linters only on staged files, keeping commits fast.

### `commit-msg` — validate commit message format

```sh
npx --no -- commitlint --edit "$1"
```

> **Important**: The `--no` flag prevents npm from treating `--edit` as an npm option. Always use this form with commitlint.

The `$1` argument is the path to the file containing the commit message (provided by git).

### `pre-push` — run test suite before pushing

```sh
npm test
```

Blocks pushes to remote when any test fails.

### `post-merge` — reinstall dependencies after pull

```sh
npm install
```

Useful to ensure `node_modules` stays in sync after pulling changes that modify `package.json`.

---

## Hook File Permissions

Hooks must be executable. Verify with:

```bash
ls -la .husky/
```

Expected output for each hook: `-rwxr-xr-x`

Fix missing execute permission:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

---

## Bypassing Hooks

### Skip a single hook (escape hatch)

```bash
# Skip pre-commit hook
git commit --no-verify -m "feat: emergency hotfix"

# Skip pre-push hook
git push --no-verify
```

> ⚠️ Use `--no-verify` only as a last resort. Never bypass hooks routinely.

### Disable hooks in CI environments

Husky automatically skips hook installation when the `CI` environment variable is set. No extra configuration needed for standard CI providers (GitHub Actions, CircleCI, etc.).

For custom CI setups, ensure `CI=true` is exported before running `npm install`:

```bash
CI=true npm install
```

Or add a check to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky || true"
  }
}
```

The `|| true` ensures `npm install` never fails in environments where `.git` doesn't exist (e.g., Docker build stages, npm pack).

---

## Troubleshooting

### Hooks are not running

1. Verify hooks are executable: `ls -la .husky/`
2. Verify Husky is installed: `ls node_modules/.bin/husky`
3. Verify `prepare` script exists in `package.json`
4. Run `npm run prepare` manually to reinstall hooks
5. Check `.git/hooks/` — there should be a symlink or script for each Husky hook

### Hook runs but tool is not found (`npx: not found`)

Ensure `node` and `npm`/`npx` are on `PATH` in the shell that git spawns. On macOS with `nvm` or `volta`, you may need to source your shell profile:

```sh
# .husky/pre-commit
. ~/.nvm/nvm.sh  # if using nvm
npx lint-staged
```

### `prepare` fails in production / Docker

Use `"prepare": "husky || true"` to silently skip when `.git` is absent:

```json
{
  "scripts": {
    "prepare": "husky || true"
  }
}
```

### Hooks do not run in a monorepo

If Husky is installed in a sub-package but hooks should fire from the repo root, set the `HUSKY` env variable or run `npx husky init` from the root, pointing to the root `.git`.

---

## `.husky/` Directory Structure

```
.husky/
├── pre-commit      # Runs before git creates the commit object
├── commit-msg      # Runs after the commit message is written
├── pre-push        # Runs before git pushes to remote
└── _/              # Husky internals (do not edit)
    └── husky.sh
```

---

## Checklist: Full QA Hook Setup

- [ ] `npm install --save-dev husky` done
- [ ] `npx husky init` run (creates `.husky/`, adds `prepare` script)
- [ ] `"prepare": "husky"` present in `package.json`
- [ ] `.husky/pre-commit` created and executable (`chmod +x`)
- [ ] `.husky/commit-msg` created with `npx --no -- commitlint --edit "$1"` and executable
- [ ] `.husky/pre-push` created with `npm test` and executable
- [ ] `npm run prepare` runs without errors
- [ ] Test hooks manually: attempt a commit with a bad message, verify rejection

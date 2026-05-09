---
name: lint-staged
description: "Use when configuring lint-staged to run linters only on git-staged files as part of a pre-commit hook. Covers .lintstagedrc.json setup, file glob patterns, tool integration (Oxlint, Oxfmt, Biome, ESLint, Prettier), and performance tuning."
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://github.com/lint-staged/lint-staged
    - https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
    - https://github.com/lint-staged/lint-staged?tab=readme-ov-file#filtering-files
---

# lint-staged Specialist

## Mission

Configure [lint-staged](https://github.com/lint-staged/lint-staged) to run linters and formatters **only on git-staged files**, making pre-commit hooks fast and focused regardless of project size. Integrate cleanly with Husky, Oxlint, Oxfmt, Biome, ESLint, and Prettier.

---

## When to Use

Activate this skill for any of the following:

- Adding lint-staged to a project's pre-commit workflow
- Writing or tuning `.lintstagedrc.json` (or equivalent config)
- Debugging lint-staged not running or running on wrong files
- Configuring lint-staged with Oxlint, Oxfmt, Biome, ESLint, or Prettier, according to project needs
- Handling edge cases: JSON files, generated files, monorepos
- Tuning performance (concurrent tasks, shell commands)

---

## Installation

```bash
npm install --save-dev lint-staged
```

---

## Configuration Files

lint-staged reads configuration from any of these locations (in priority order):

1. `.lintstagedrc.json` (recommended — explicit and editor-friendly)
2. `.lintstagedrc.js` / `.lintstagedrc.mjs` (for dynamic configs)
3. `lint-staged` key in `package.json`
4. `lint-staged.config.js`

### Recommended: `.lintstagedrc.json`

```json
{
  "*.{js,ts}":  "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
  "*.json":     "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true"
}
```

---

## Configuration Format

Each key is a **glob pattern** matching staged file paths. The value is the command to run on matching files.

lint-staged appends the matched file paths as arguments to the command automatically.

```json
{
  "<glob>": "<command>",
  "<glob>": ["<command1>", "<command2>"]
}
```

### Glob pattern tips

| Pattern | Matches |
|---------|---------|
| `*.js` | `.js` files in any directory |
| `*.{js,ts}` | `.js` and `.ts` files in any directory |
| `**/*.js` | `.js` files recursively (same as `*.js` in lint-staged) |
| `src/**/*.ts` | `.ts` files only inside `src/` |
| `*.{js,jsx,ts,tsx}` | All JS/TS variants |

> lint-staged glob patterns match against staged file paths relative to the project root, so `*.js` already matches files in subdirectories.

---

## Running Multiple Commands

Pass an array to run multiple commands on the same file set:

```json
{
  "*.{js,ts}": [
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
    "some-other-tool"
  ]
}
```

Commands run **sequentially** by default. Use `concurrent: true` (JS config only) for parallel execution.

---

## Integration Recipes

### With Oxlint

```json
{
  "*.{js,jsx,ts,tsx,mjs,cjs}": "oxlint --fix"
}
```

### With Oxfmt

```json
{
  "*": "oxfmt --no-error-on-unmatched-pattern"
}
```

### With Biome

```json
{
  "*.{js,ts}": "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
  "*.json":    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true"
}
```

**Why `--no-errors-on-unmatched`?**
When lint-staged passes staged file paths to Biome, some paths may not match Biome's internal `files.includes`. This flag prevents Biome from exiting with an error in that case.

**Why `--files-ignore-unknown=true`?**
Prevents Biome from failing on file types it doesn't recognise (e.g. `.md`, `.svg`).

### With ESLint

```json
{
  "*.{js,ts,jsx,tsx}": "eslint --fix --max-warnings=0"
}
```

### With Prettier

```json
{
  "*.{js,ts,jsx,tsx,json,css,md}": "prettier --write"
}
```

### With ESLint + Prettier together

```json
{
  "*.{js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}":   "prettier --write"
}
```

### With Stylelint

```json
{
  "*.{css,scss}": "stylelint --fix"
}
```

---

## Husky Integration

lint-staged is designed to be called from a Husky `pre-commit` hook:

**`.husky/pre-commit`:**

```sh
npx lint-staged
```

That's it. lint-staged reads its config, finds staged files matching each glob, and runs the associated commands.

---

## Important Flags

| Flag | Purpose |
|------|---------|
| `--fix` (Oxlint) | Auto-fix lint issues |
| `--no-error-on-unmatched-pattern` (Oxfmt) | Don't error if no files match Oxfmt's include patterns |
| `--no-errors-on-unmatched` (Biome) | Don't error if no files match Biome's include patterns |
| `--files-ignore-unknown=true` (Biome) | Don't error on unknown file types |
| `--fix` (ESLint) | Auto-fix lint issues |
| `--max-warnings=0` (ESLint) | Treat warnings as errors in CI |
| `--write` (Prettier) | Auto-format files in place |

---

## Staged Files Behaviour

lint-staged:
1. Gets the list of staged files from git
2. Matches them against configured globs
3. Runs the configured command(s) with matched file paths appended as arguments
4. **Re-stages** any files the command modified (so fixes are included in the commit)

> Step 4 means lint-staged auto-stages formatted files — you don't need to `git add` them again after `biome check --write` runs.

---

## Excluding Files

lint-staged operates on staged files only, so it naturally skips unstaged files. To exclude specific staged files from a command, use a more specific glob:

```json
{
  "src/**/*.{js,ts}": "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true"
}
```

This runs only on staged files inside `src/`, ignoring staged files elsewhere.

---

## Troubleshooting

### lint-staged not running

1. Verify Husky hook exists and is executable: `ls -la .husky/pre-commit`
2. Verify hook contains `npx lint-staged`
3. Run `npx lint-staged` manually to test outside of git
4. Check for config file: `ls .lintstagedrc*`

### `No staged files match any configured task`

This is informational (not an error). It means no staged files matched your glob patterns. Commit proceeds normally.

### Command modifies files but they are not re-staged

lint-staged re-stages modified files automatically. If this is not happening:
- Ensure the command actually writes files (e.g. `biome check --write`, not just `biome check`)
- Check that lint-staged version is >= 10 (auto-staging was added in v10)

### Husky + lint-staged on Windows

- Use `npx lint-staged` (not `lint-staged` directly) to ensure cross-platform resolution
- Ensure line endings in hook files are LF, not CRLF
- Verify `node` and `npx` are on `PATH` in the git hook shell context

### Performance: too slow on large changesets

- Use more specific globs (`src/**/*.ts` vs `*.ts`) to reduce matched files
- Run formatters and linters as separate tasks so they can be tuned independently
- Avoid running slow tools (e.g. type-check) in pre-commit; reserve those for CI or pre-push

---

## Checklist: lint-staged Setup

- [ ] `npm install --save-dev lint-staged` done
- [ ] Config file created (`.lintstagedrc.json` recommended)
- [ ] Glob patterns match the file types in the project
- [ ] Commands include auto-fix flags (`--write`, `--fix`)
- [ ] Biome commands include `--no-errors-on-unmatched --files-ignore-unknown=true` (if project uses Biome)
- [ ] Oxfmt command includes `--no-error-on-unmatched-pattern` (if project uses Oxfmt)
- [ ] Oxlint command includes `--fix` (if project uses Oxlint)
- [ ] Husky `pre-commit` hook contains `npx lint-staged`
- [ ] Tested manually: `npx lint-staged` runs without error on a staged file
- [ ] Tested end-to-end: `git commit` triggers the hook and auto-fixes are re-staged

---
name: oxfmt
description: "Use when configuring, running, or troubleshooting Oxfmt in a JavaScript/TypeScript project. Covers .oxfmtrc.json setup, CLI commands, formatting options, sorting features, and CI/pre-commit integration."
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://oxc.rs/docs/guide/usage/formatter.html
    - https://oxc.rs/docs/guide/usage/formatter/cli.html
    - https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html
---

# Oxfmt Specialist

## Mission

Configure, run, and maintain [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) as the project's formatter. Keep formatting deterministic, fast, and low-friction across local development, CI, editors, and pre-commit workflows.

---

## When to Use

Activate this skill for any of the following:

- Initial Oxfmt setup in a new or existing project
- Writing or tuning `.oxfmtrc.json`
- Defining the project's formatting conventions
- Diagnosing `format:check` failures or unexpected rewrites
- Migrating from Prettier or Biome to Oxfmt
- Deciding whether to enable sorting features like import sorting or package.json sorting
- Wiring Oxfmt into `package.json`, CI, or `lint-staged`
- Troubleshooting ignore behavior, overrides, or editor differences

---

## What Oxfmt Is Good At

Oxfmt is a fast formatter in the Oxc toolchain. Use it for:

- Stable formatting for JS, JSX, TS, TSX, JSON, YAML, CSS, Markdown, and more
- Simple formatter configuration close to Prettier's mental model
- Fast formatting in local dev and CI
- Built-in sorting features for imports, Tailwind classes, and `package.json`

Use Oxfmt for formatting, not linting. Pair it with Oxlint for lint rules.

---

## Installation

```bash
pnpm add -D oxfmt
```

### Initialise configuration

```bash
pnpm oxfmt --init
```

### Migrate from another formatter

```bash
pnpm oxfmt --migrate prettier
pnpm oxfmt --migrate biome
```

---

## Configuration File

Recommended default: use `.oxfmtrc.json`.

### Minimal production-ready config

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none",
  "ignorePatterns": ["dist/**", "coverage/**", "node_modules/**"]
}
```

### Important top-level fields

| Field | Purpose | Notes |
|------|---------|-------|
| `printWidth` | Line wrapping target | Default is `100` |
| `tabWidth` | Spaces per indent level | Default is `2` |
| `useTabs` | Tabs vs spaces | Default is `false` |
| `semi` | Semicolons | Default is `true` |
| `singleQuote` | Single vs double quotes | JSX uses `jsxSingleQuote` |
| `trailingComma` | Trailing comma style | `all`, `es5`, `none` |
| `ignorePatterns` | Exclude files and folders | Relative to config file |
| `overrides` | Per-file formatting options | Good for Markdown, tests, JSON |
| `sortImports` | Import sorting | Disabled by default |
| `sortPackageJson` | Package key sorting | Enabled by default |
| `sortTailwindcss` | Tailwind class sorting | Disabled by default |

---

## Core CLI Commands

```bash
# Format current project in place
pnpm oxfmt .

# Check formatting without writing
pnpm oxfmt --check .

# List files that differ
pnpm oxfmt --list-different .

# Use a specific config
pnpm oxfmt -c .oxfmtrc.json .

# Format stdin content
echo 'const  x = 1' | pnpm oxfmt --stdin-filepath src/example.ts
```

### Useful CLI flags

| Flag | Purpose |
|------|---------|
| `--check` | Validate formatting without writing |
| `--list-different` | Print only changed file paths |
| `--write` | Write in place; default mode |
| `--config` | Use a specific config file |
| `--ignore-path` | Add ignore file(s) |
| `--no-error-on-unmatched-pattern` | Useful for `lint-staged` |
| `--stdin-filepath` | Lets Oxfmt choose parser for stdin |
| `--threads` | Control concurrency |
| `--migrate` | Create config from Prettier or Biome |

### Recommended `package.json` scripts

```json
{
  "scripts": {
    "format": "oxfmt .",
    "format:check": "oxfmt --check ."
  }
}
```

---

## Recommended Formatting Baseline

For most TypeScript frontend projects, a good baseline is:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "trailingComma": "none",
  "endOfLine": "lf",
  "insertFinalNewline": true
}
```

### Why this baseline works well

- `printWidth: 100` fits TypeScript better than 80 in many projects
- `tabWidth: 2` matches common web UI codebases
- `singleQuote: true` reduces visual noise in JS/TS code
- `semi: false` matches standard semicolon-free styles
- `trailingComma: none` is useful when migrating from Biome or semicolon-light codebases

Adjust only if the repo already has strong formatting conventions.

---

## Ignore Patterns

Use `ignorePatterns` to exclude generated files, build artifacts, and tool internals:

```json
{
  "ignorePatterns": [
    "dist/**",
    "coverage/**",
    "node_modules/**",
    ".tanstack/**",
    ".vinxi/**",
    "**/*.gen.ts",
    "**/*.gen.tsx"
  ]
}
```

### Ignore guidance

- Ignore generated code that should not be hand-edited
- Ignore build output and coverage artifacts
- Ignore internal tool directories if they are not part of the real source tree
- Prefer config-level ignores so editor, CI, and local behavior stay consistent

---

## Overrides

Use overrides for file-specific formatting behavior.

### Example: wider tests, preserved Markdown prose

```json
{
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx"],
      "options": {
        "printWidth": 120
      }
    },
    {
      "files": ["**/*.md"],
      "options": {
        "proseWrap": "preserve"
      }
    }
  ]
}
```

### Good override use cases

- Longer test files or fixtures
- Markdown prose wrapping behavior
- JSON files needing different line width
- JSX or HTML-specific formatting choices

---

## Sorting Features

Oxfmt can do more than whitespace formatting. Use these features carefully.

### `sortImports`

Disabled by default. Useful if the team wants formatter-driven import ordering.

```json
{
  "sortImports": {
    "internalPattern": ["@/"],
    "groups": [
      "builtin",
      "external",
      ["internal", "subpath"],
      ["parent", "sibling", "index"],
      "style",
      "unknown"
    ]
  }
}
```

### `sortPackageJson`

Enabled by default. You can configure it or disable it:

```json
{
  "sortPackageJson": {
    "sortScripts": false
  }
}
```

### `sortTailwindcss`

Only enable this in Tailwind projects:

```json
{
  "sortTailwindcss": {
    "functions": ["clsx", "cn", "cva"]
  }
}
```

### Sorting recommendations

- Do not enable `sortImports` casually in large repos without agreement
- Keep `sortSideEffects: false` unless the team explicitly wants side-effect import sorting
- Keep `sortPackageJson` on unless it conflicts with another established tool
- Only enable `sortTailwindcss` in real Tailwind projects

---

## Option Reference: Commonly Tuned Settings

| Option | Common values | Notes |
|-------|---------------|-------|
| `semi` | `true`, `false` | Statement semicolons |
| `singleQuote` | `true`, `false` | JS/TS string quotes |
| `jsxSingleQuote` | `true`, `false` | JSX attribute quotes |
| `trailingComma` | `all`, `es5`, `none` | Multi-line structures |
| `bracketSpacing` | `true`, `false` | Object literal spaces |
| `arrowParens` | `always`, `avoid` | Single-arg arrow functions |
| `quoteProps` | `as-needed`, `consistent`, `preserve` | Object property quotes |
| `proseWrap` | `preserve`, `always`, `never` | Markdown text wrapping |
| `objectWrap` | `preserve`, `collapse` | Multi-line object handling |
| `singleAttributePerLine` | `true`, `false` | JSX/HTML attribute wrapping |
| `bracketSameLine` | `true`, `false` | Multi-line JSX closing bracket placement |

---

## Troubleshooting

### `format:check` fails unexpectedly

Check these first:

- Oxfmt config changed
- Ignore patterns do not exclude generated or tool files
- The repo was never reformatted after enabling Oxfmt
- Another formatter wrote different styles into the same files

The easiest diagnosis:

```bash
pnpm oxfmt --list-different .
```

### Oxfmt is formatting files it should ignore

- Add them to `ignorePatterns` in `.oxfmtrc.json`
- Or pass `--ignore-path` if the project needs extra ignore files
- Remember paths are resolved from the config file location

### `lint-staged` fails with unmatched patterns

Use:

```bash
oxfmt --no-error-on-unmatched-pattern
```

Example:

```json
{
  "*": "oxfmt --no-error-on-unmatched-pattern"
}
```

### Output differs from Prettier or Biome

That is normal in some cases. Check:

- `printWidth`
- `semi`
- `singleQuote`
- `trailingComma`
- sorting features
- JSX-specific settings like `jsxSingleQuote`

If the repo is migrating tools, run a single intentional formatting pass and commit it separately from feature work.

### Editor formatting differs from CLI

Usually caused by:

- Editor still using Prettier or Biome
- Editor not reading `.oxfmtrc.json`
- `.editorconfig` affecting fallback values for unset fields
- A different working directory than the repo root

---

## CI and Pre-Commit

### CI pattern

```json
{
  "scripts": {
    "format": "oxfmt .",
    "format:check": "oxfmt --check ."
  }
}
```

Use `format:check` in CI, not `format`.

### lint-staged pattern

```json
{
  "*.{js,jsx,ts,tsx,json,css,md}": "oxfmt --no-error-on-unmatched-pattern"
}
```

If Oxlint is also used in pre-commit, keep the responsibilities clear:

- Oxfmt formats
- Oxlint lints and optionally auto-fixes lint issues

---

## Practical Defaults

If you're introducing Oxfmt into a modern web repo, prefer this workflow:

1. Add `.oxfmtrc.json`
2. Encode only the conventions the team really cares about
3. Add `format` and `format:check` scripts
4. Ignore generated and tool-only directories early
5. Run one repo-wide formatting pass
6. Keep `format:check` non-mutating in CI

Recommended conservative baseline:

- `printWidth: 100`
- `tabWidth: 2`
- `useTabs: false`
- `singleQuote: true`
- `jsxSingleQuote: true`
- `semi: false`
- `trailingComma: none`
- `proseWrap: preserve`
- `sortImports: off` unless explicitly wanted

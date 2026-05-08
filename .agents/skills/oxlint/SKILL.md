---
name: oxlint
description: "Use when configuring, running, or troubleshooting Oxlint in a JavaScript/TypeScript project. Covers .oxlintrc.json setup, plugin selection, rule tuning, CLI commands, type-aware linting, and CI/pre-commit integration."
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://oxc.rs/docs/guide/usage/linter.html
    - https://oxc.rs/docs/guide/usage/linter/rules.html
    - https://oxc.rs/docs/guide/usage/linter/cli.html
    - https://oxc.rs/docs/guide/usage/linter/config-file-reference.html
---

# Oxlint Specialist

## Mission

Configure, run, and maintain [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) as the project's linter for JavaScript and TypeScript code. Make pragmatic choices about plugins, categories, type-aware rules, ignore patterns, and CI/pre-commit integration so linting stays fast, useful, and low-noise.

---

## When to Use

Activate this skill for any of the following:

- Initial Oxlint setup in a new or existing project
- Writing or tuning `.oxlintrc.json` or `oxlint.config.ts`
- Choosing Oxlint plugins for React, TypeScript, Node, imports, Vitest, accessibility, or promises
- Diagnosing lint errors, warnings, false positives, or unsupported rule names
- Enabling type-aware linting with `oxlint-tsgolint`
- Wiring Oxlint into `package.json`, CI, or `lint-staged`
- Migrating from ESLint or Biome to Oxlint
- Printing or inspecting the effective configuration for a file

---

## What Oxlint Is Good At

Oxlint is a high-performance linter built on the Oxc toolchain. Use it when you want:

- Fast feedback on correctness and suspicious code
- Native Rust implementations of many common ESLint plugin ecosystems
- TypeScript support without the usual ESLint plugin overhead
- Type-aware rules when needed via `oxlint-tsgolint`
- CI-friendly machine-readable output and fast local iteration

Use Oxlint for linting, not formatting. Pair it with Oxfmt for formatting.

---

## Installation

### Base install

```bash
pnpm add -D oxlint
```

### Type-aware install

```bash
pnpm add -D oxlint oxlint-tsgolint
```

### Initialise configuration

```bash
pnpm oxlint --init
```

This creates a starter `.oxlintrc.json`. Most teams then commit a tuned config file.

---

## Configuration File Choices

Oxlint supports:

- `.oxlintrc.json`
- `.oxlintrc.jsonc`
- `oxlint.config.ts`

Recommended default: use `.oxlintrc.json` unless the project needs dynamic configuration.

### Minimal production-ready config

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "unicorn", "oxc"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "ignorePatterns": ["dist/**", "coverage/**", "node_modules/**"],
  "rules": {
    "no-debugger": "error",
    "no-console": "warn"
  }
}
```

### Important top-level fields

| Field | Purpose | Notes |
|------|---------|-------|
| `plugins` | Enables built-in plugin rule sets | Setting this replaces the default plugin set |
| `categories` | Turns groups of rules on/off by severity | Good first pass before tuning individual rules |
| `rules` | Fine-grained rule config | Overrides category behavior |
| `ignorePatterns` | Ignores files/directories | Paths are relative to the config file |
| `env` | Adds environment globals | e.g. `browser`, `node`, `builtin` |
| `globals` | Declares project globals | Prefer this over disabling undefined-variable style rules |
| `settings` | Plugin-specific shared config | React, jsx-a11y, Vitest, etc. |
| `overrides` | Per-file config | Useful for tests, config files, generated code |
| `options` | Linter-level behavior | Includes `typeAware`, `typeCheck`, warning behavior |

---

## Categories and Severity Strategy

Oxlint categories are the fastest way to define a baseline:

- `correctness` - definitely wrong or useless code
- `suspicious` - likely wrong or fragile code
- `pedantic` - stricter rules that may have false positives
- `perf` - performance-oriented suggestions
- `style` - idiomatic style rules
- `restriction` - bans patterns or features
- `nursery` - still evolving rules

Recommended starting point:

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  }
}
```

Avoid enabling `pedantic`, `style`, or `restriction` broadly at the start unless the repo already wants that strictness.

---

## Built-in Plugins

Oxlint supports many native plugin ecosystems. Common ones:

| Plugin | Use for |
|-------|---------|
| `typescript` | TS syntax and TypeScript-oriented rules |
| `react` | React and React Hooks rules |
| `react-perf` | React render performance anti-patterns |
| `import` | import order, cycles, duplicates, self-imports |
| `jsx-a11y` | JSX accessibility checks |
| `promise` | Promise handling and async behavior |
| `vitest` | Vitest-specific test rules |
| `node` | Node/runtime script patterns |
| `unicorn` | General code-quality rules |
| `oxc` | Oxc-specific and deepscan-derived rules |
| `eslint` | Core ESLint-compatible rules |

### Good plugin set for React + TypeScript apps

```json
{
  "plugins": [
    "eslint",
    "typescript",
    "unicorn",
    "oxc",
    "react",
    "react-perf",
    "import",
    "jsx-a11y",
    "promise",
    "vitest"
  ]
}
```

### Plugin selection guidelines

- Add `react` for any React project
- Add `import` when path aliases, cycles, duplicates, or module hygiene matter
- Add `jsx-a11y` for JSX UI projects
- Add `promise` when async correctness matters
- Add `vitest` or `jest` only if the project uses that runner
- Add `node` for config files, scripts, CLIs, or server code
- Add `react-perf` if the project is performance-sensitive and wants anti-pattern detection

---

## React and Framework Setup

For React apps, configure the plugin settings explicitly.

### React 19 automatic JSX runtime

Oxlint's React plugin may still flag legacy JSX scope rules. For React 17+ automatic JSX runtime, disable:

```json
{
  "rules": {
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Router link components

For frameworks that use custom link components, map them in `settings`:

```json
{
  "settings": {
    "react": {
      "linkComponents": [
        {
          "name": "Link",
          "linkAttribute": ["to", "href"]
        }
      ]
    },
    "jsx-a11y": {
      "components": {
        "Link": "a"
      }
    }
  }
}
```

This is useful for React Router, TanStack Router, and similar libraries.

### Common React rules to consider

| Rule | Suggested default | Notes |
|------|-------------------|-------|
| `react/button-has-type` | `warn` | Helpful for reusable button components |
| `react/no-array-index-key` | `warn` | Useful for dynamic list rendering |
| `react/self-closing-comp` | `warn` | Low-noise readability win |
| `react/jsx-uses-react` | `off` in React 19 | Legacy runtime rule |
| `react/react-in-jsx-scope` | `off` in React 19 | Legacy runtime rule |

---

## Type-Aware Linting

Type-aware linting requires `oxlint-tsgolint`.

### Enable it in config

```json
{
  "options": {
    "typeAware": true
  }
}
```

### Or enable it from CLI

```bash
pnpm oxlint --type-aware
```

### Useful type-aware rules

```json
{
  "rules": {
    "typescript/await-thenable": "error",
    "typescript/no-floating-promises": ["error", { "ignoreVoid": true }],
    "typescript/no-misused-promises": ["warn", { "checksVoidReturn": false }]
  }
}
```

### When to enable `typeCheck`

Use `typeCheck` only if you want Oxlint to also report TypeScript compiler diagnostics:

```json
{
  "options": {
    "typeAware": true,
    "typeCheck": true
  }
}
```

If the repo already runs `tsc --noEmit`, you may not need `typeCheck` yet.

### Type-aware gotchas

- Requires `oxlint-tsgolint` installed
- Depends on a sane `tsconfig.json`
- Broad `include` globs can hurt performance badly
- May surface React event-handler noise unless rule options are tuned

---

## CLI Commands

### Most useful commands

```bash
# Lint current project
pnpm oxlint

# Lint and auto-fix safe issues
pnpm oxlint --fix

# Type-aware linting
pnpm oxlint --type-aware

# Type-aware linting plus TS diagnostics
pnpm oxlint --type-aware --type-check

# Use a specific config
pnpm oxlint -c .oxlintrc.json

# Inspect effective config
pnpm oxlint --print-config

# Machine-readable output for CI
pnpm oxlint -f json

# Show all registered rules
pnpm oxlint --rules
```

### Useful CLI flags

| Flag | Purpose |
|------|---------|
| `--fix` | Apply safe fixes |
| `--fix-suggestions` | Apply suggestions that may change behavior |
| `--fix-dangerously` | Apply dangerous fixes |
| `--type-aware` | Enable type-aware rules |
| `--type-check` | Include TS diagnostics |
| `--deny-warnings` | Fail on warnings |
| `--max-warnings` | Cap warning count |
| `--print-config` | Inspect final config |
| `--tsconfig` | Use non-default tsconfig path |
| `-f json` | JSON output for CI or tooling |

### Recommended `package.json` scripts

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

For stricter CI:

```json
{
  "scripts": {
    "lint:ci": "oxlint --deny-warnings"
  }
}
```

---

## Ignore Patterns and Generated Files

Use `ignorePatterns` in config for build output, generated code, and tooling artifacts:

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

Prefer config-level ignores over CLI-only ignores so local, CI, and editor behavior stay aligned.

---

## Overrides

Use overrides for tests, config files, or scripts.

### Example: Vitest tests

```json
{
  "overrides": [
    {
      "files": ["test/**/*.{ts,tsx}"],
      "env": {
        "vitest": true,
        "node": true
      },
      "rules": {
        "import/first": "off",
        "no-console": "off"
      }
    }
  ]
}
```

### Example: Node config files

```json
{
  "overrides": [
    {
      "files": ["vite.config.ts", "vitest.config.ts"],
      "env": {
        "node": true
      }
    }
  ]
}
```

---

## Rule Tuning Approach

When Oxlint reports issues, tune rules in this order:

1. Check if the rule is correct and the code should change
2. If not, see whether plugin `settings` can teach Oxlint about the framework pattern
3. If still noisy, scope the rule down with `overrides`
4. Only then disable the rule globally

### Good candidates for repo-specific tuning

| Rule | Why tune it |
|------|-------------|
| `import/no-unassigned-import` | CSS side-effect imports and setup files are common in frontend apps |
| `jsx-a11y/anchor-is-valid` | Custom router links may confuse the rule |
| `promise/catch-or-return` | Tests often intentionally ignore returned promises |
| `typescript/no-misused-promises` | React callback usage sometimes needs options |

---

## Troubleshooting

### "Rule not found"

Usually means one of:

- The plugin is not enabled in `plugins`
- The rule name is wrong
- The rule exists in ESLint but is not implemented in Oxlint yet

Check with:

```bash
pnpm oxlint --rules
```

### Too many false positives in React

- Disable `react/react-in-jsx-scope` and `react/jsx-uses-react` for React 19
- Add `settings.react.linkComponents`
- Add `settings.jsx-a11y.components` for custom components
- Use `overrides` for tests and config files

### Type-aware linting is slow

- Check `tsconfig.json` `include` patterns
- Avoid broad includes like `"**/*"`
- Exclude build output and generated files
- Run with:

```bash
OXC_LOG=debug pnpm oxlint --type-aware
```

### Lint passes locally but fails in CI

Common causes:

- Different Node or package versions
- Missing generated files or stale installs
- CI using `--deny-warnings`
- Different working directory or config path

### Import plugin misses aliases

- Ensure `tsconfig.json` exists and is correct
- Use `--tsconfig` if the config is not named `tsconfig.json`
- Keep path aliases in sync with the actual project config

---

## CI and Pre-Commit

### CI pattern

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:ci": "oxlint --deny-warnings"
  }
}
```

### lint-staged pattern

```json
{
  "*.{js,jsx,ts,tsx,mjs,cjs}": "oxlint --fix"
}
```

If the project also formats staged files, let Oxfmt handle formatting and Oxlint handle linting.

---

## Practical Defaults

If you're setting up Oxlint in a modern React + TypeScript repo, prefer this baseline:

- Enable `eslint`, `typescript`, `unicorn`, `oxc`, `react`, `import`, `jsx-a11y`, `promise`
- Add `vitest` for Vitest repos
- Add `react-perf` only if the team wants render anti-pattern checks
- Start with `correctness: error`, `suspicious: warn`, `perf: warn`
- Disable legacy React JSX scope rules for React 19
- Ignore generated files and build output
- Use overrides for tests and Node config files
- Add type-aware rules only after the repo is already clean on non-type-aware linting

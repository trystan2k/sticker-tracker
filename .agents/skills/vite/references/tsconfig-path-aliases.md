---
name: vite-tsconfig-path-aliases
description: Prefer vite-tsconfig-paths over duplicating TypeScript path aliases in Vite config
---

# TypeScript Path Aliases

When a Vite project uses TypeScript path aliases defined in `tsconfig.json`, prefer `vite-tsconfig-paths` instead of manually duplicating aliases in `vite.config.ts`.

## Rule

- If `compilerOptions.paths` is configured in `tsconfig.json`, use `vite-tsconfig-paths` in `vite.config.ts`.
- Do not manually repeat the same alias map in `resolve.alias` unless there is a specific non-TypeScript alias that is not represented in `tsconfig.json`.
- Keep TypeScript and Vite path resolution sourced from the same config to avoid drift.

## Preferred Pattern

```ts
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
})
```

## Do / Don't

- Do: define aliases once in `tsconfig.json`
- Do: use `vite-tsconfig-paths()` in `vite.config.ts`
- Do: keep Vite and TypeScript resolution behavior aligned
- Don't: duplicate `@`, `@test`, or other TS aliases manually in `resolve.alias`
- Don't: maintain two separate alias maps for the same paths

## Notes

This reduces configuration drift, avoids mismatches between editor/type-checking and runtime resolution, and keeps Vite setup simpler in TypeScript projects.

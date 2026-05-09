# TypeScript Module File Naming (Padel Buddy Web)

Use `kebab-case` for TypeScript modules that are not React components.

## Rules

- Apply `kebab-case` to shared helpers, utilities, domain modules, and other non-component `.ts` or `.tsx` files.
- Reserve `PascalCase` filenames for React components and their matching component CSS Modules.
- Keep test helper modules in `kebab-case` even when they return JSX.

## Preferred Pattern

```text
test/utils/
  render-component.tsx

src/core/match/
  score-engine.ts
  match-state.ts
```

## Do / Don't

- Do: `render-component.tsx`
- Do: `score-engine.ts`
- Do: `match-state.ts`
- Don't: `render_component.tsx`
- Don't: `scoreEngine.ts`
- Don't: `MatchState.ts`

## Notes

This keeps TypeScript modules consistent with the repository's general file naming style while leaving component filenames reserved for React UI entry points.

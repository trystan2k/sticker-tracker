# React Type Import Conventions (Padel Buddy Web)

Use explicit React type imports in TypeScript files.

## Rules

- Do not use React namespace globals (for example, `React.ReactNode`).
- Import React types with `import type` from `react`.
- Keep runtime and type-only imports separate when possible.

## Preferred Pattern

```tsx
import type { ReactNode } from 'react'

function RootDocument({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

## Do / Don't

- Do: `import type { ReactNode } from 'react'`
- Do: `import type { FC, ComponentProps } from 'react'`
- Don't: `React.ReactNode`
- Don't: `import * as React from 'react'`

## Notes

This keeps types explicit, modern, and aligned with React 19 + TypeScript conventions used in this repository.

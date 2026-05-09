---
name: react-development
description: Modern React 19 patterns and best practices. Covers Server Components, Hooks, Effects, and Refs. Use when writing React components.
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://react.dev/blog/2024/04/25/react-19
    - https://react.dev/learn
    - https://skills.sh/0xbigboss/claude-code/react-best-practices
    - https://github.com/Gentleman-Programming/Gentleman-Skills/blob/main/curated/react-19/SKILL.md
---

# Modern React & Best Practices

## 1. Core Principles

### Server Components First
- **Default**: Server Components (async, no "use client").
- **Client**: Add `"use client"` only for interactivity (state, effects, event listeners, browser APIs).

```typescript
// ✅ Server Component (default) - no directive
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// ✅ Client Component - only when needed
"use client";
export function Interactive() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Imports
- **ALWAYS**: Named imports (`import { useState, useEffect } from "react"`).
- **NEVER**: `import React from "react"` or `import * as React from "react"`.

### Pair with TypeScript
When working with React, always load both this skill and `typescript-best-practices` together. TypeScript patterns (type-first development, discriminated unions, Zod validation) apply to React code.

## 2. React 19 Features

### The `use` Hook
- Read promises (suspends until resolved) and Context.
- Can be called conditionally (unlike hooks).

```typescript
import { use } from "react";

// Read promises (suspends)
function Comments({ promise }) {
  const comments = use(promise);
  return comments.map(c => <div key={c.id}>{c.text}</div>);
}

// Conditional context
function Theme({ showTheme }) {
  if (showTheme) {
    const theme = use(ThemeContext);
    return <div style={{ color: theme.primary }}>Themed</div>;
  }
  return <div>Plain</div>;
}
```

### Actions & `useActionState`
- Handle form submissions with pending state.

```typescript
"use server";
async function submitForm(prevState, formData) {
  await saveToDatabase(formData);
  revalidatePath("/");
}

// Component
import { useActionState } from "react";

function Form() {
  const [state, action, isPending] = useActionState(submitForm, null);
  return (
    <form action={action}>
      <button disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

### Ref as Prop
- No more `forwardRef`. Just use `ref` prop.

```typescript
// ✅ React 19: ref is just a prop
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

## 3. Effects & Synchronization

**Core Principle**: Effects are escape hatches to synchronize with external systems. Avoid them for data flow.

### When NOT to Use Effects
- **Derived State**: Calculate during render.
- **User Events**: Put logic in event handlers.
- **Resetting State**: Use `key` prop on the component.
- **Expensive Calculations**: Use `useMemo` (though React Compiler may optimize this away).

```typescript
// BAD: Effect for derived state
useEffect(() => { setFullName(first + last); }, [first, last]);

// GOOD: Calculated during render
const fullName = first + last;
```

### Effect Best Practices
- **Dependencies**: Never suppress linter. Fix the code (move objects inside, use updater functions).
- **Cleanup**: Always clean up subscriptions/listeners.
- **useEffectEvent**: Extract non-reactive logic.

```typescript
// Updater function removes dependency
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []); // No 'count' dependency
```

## 4. Refs & State

- **Refs**: Use for values that don't trigger re-render (timers, DOM nodes).
- **Rules**: Never read/write `ref.current` during render.
- **DOM**: Use `ref` callback for dynamic lists.

```typescript
// GOOD: Ref for timeout ID (doesn't affect UI)
const timeoutRef = useRef(null);

function handleClick() {
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => { ... }, 1000);
}
```

## 5. Composition & Custom Hooks

- **Composition**: Prefer passing components as `children` or props over prop drilling.
- **Custom Hooks**: Share logic, not state. Name with `use` prefix.
- **Controlled vs Uncontrolled**: Choose who owns the state.

```typescript
// Controlled: parent owns state
function SearchInput({ query, onQueryChange }) {
  return <input value={query} onChange={e => onQueryChange(e.target.value)} />;
}
```

## Summary: Decision Tree

1. **Need to respond to user interaction?** Use event handler
2. **Need computed value from props/state?** Calculate during render
3. **Need cached expensive calculation?** Use useMemo
4. **Need to reset state on prop change?** Use key prop
5. **Need to synchronize with external system?** Use Effect with cleanup
6. **Need non-reactive code in Effect?** Use useEffectEvent
7. **Need mutable value that doesn't trigger render?** Use ref

## Specific tasks

* **React type imports (no namespace globals)** [references/type-import-conventions.md](references/type-import-conventions.md)
* **React file naming** [references/component-file-naming.md](references/component-file-naming.md)
- **React styling conventions** [references/styling-conventions.md](references/styling-conventions.md)
- **React barrel file imports** [references/bundle-barrel-imports.md](references/bundle-barrel-imports.md)
- **React component interfaces** [references/component-interfaces.md](references/component-interfaces.md)
- **JSX prop functions & useCallback** [references/jsx-prop-functions.md](references/jsx-prop-functions.md)

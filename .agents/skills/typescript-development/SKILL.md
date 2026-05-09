---
name: typescript-development
description: Modern TypeScript patterns, strict type safety, and runtime validation. Covers type-first development, interfaces, utility types, and Zod. Use when writing TypeScript code (.ts, .tsx).
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://www.typescriptlang.org/docs/handbook/intro.html
    - https://zod.dev/
    - https://skills.sh/0xbigboss/claude-code/typescript-best-practices
    - https://github.com/Gentleman-Programming/Gentleman-Skills/blob/main/curated/typescript/SKILL.md
---

# Modern TypeScript & Best Practices

## 1. Core Principles

### Type-First Development
- **Workflow**: Define types/interfaces first, then implement logic.
- **Strict Mode**: Always enabled. No implicit `any`.
- **No `any`**: Use `unknown` for truly unknown types, or generics.

```typescript
// ✅ Use unknown and validate
function parse(input: unknown): User {
  if (isUser(input)) return input;
  throw new Error("Invalid input");
}

// ❌ NEVER
function parse(input: any): any { }
```

## 2. Type Safety Patterns

### Const Assertions & Discriminated Unions
- **Const Assertions**: Use `as const` for literal values to infer specific types.
- **Discriminated Unions**: Use a common field (like `status` or `type`) to distinguish states.

```typescript
// ✅ Const Assertion
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number]; // "admin" | "user" | "guest"

// ✅ Discriminated Union
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### Branded Types
- Prevent mixing compatible primitive types (e.g., UserID vs OrderID).

```typescript
type UserId = string & { readonly __brand: 'UserId' };
function createUserId(id: string): UserId { return id as UserId; }
```

## 3. Interface Design

### Flat Interfaces
- Avoid deep nesting. Extract nested objects into their own named interfaces.

```typescript
// ✅ Named nested interface
interface Address {
  street: string;
  city: string;
}
interface User {
  id: string;
  address: Address;
}

// ❌ Inline nesting
interface User {
  address: { street: string; city: string };
}
```

## 4. Runtime Validation (Zod)

- **Source of Truth**: Define Zod schemas first, then infer TypeScript types.
- **Validation**: Use `parse` at trust boundaries (API responses) and `safeParse` for user input.

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

// Infer type from schema
type User = z.infer<typeof UserSchema>;

// Validate API response
async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return UserSchema.parse(await res.json());
}
```

## 5. Utility Types & Guards

### Built-in Utilities
- `Pick<T, K>`, `Omit<T, K>`, `Partial<T>`, `Required<T>`, `Readonly<T>`, `Record<K, T>`.
- `ReturnType<T>`, `Parameters<T>`.

### Type Guards
- Use user-defined type guards to narrow types.

```typescript
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value;
}
```

## 6. Configuration

- **Environment Variables**: Validate with Zod at startup.

```typescript
const ConfigSchema = z.object({
  API_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
});
export const config = ConfigSchema.parse(process.env);
```

## Summary: Checklist

1.  **Strict?** Is `strict: true` in `tsconfig.json`?
2.  **No `any`?** Are you using `unknown` or specific types?
3.  **Validation?** Are you validating external data with Zod?
4.  **Unions?** Are you using discriminated unions for state?
5.  **Consts?** Are you using `as const` for fixed values?

## Specific tasks

* **TypeScript module file naming** [references/module-file-naming.md](references/module-file-naming.md)

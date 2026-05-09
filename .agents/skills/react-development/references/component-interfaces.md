# React Component Interfaces and Types

When creating an interface or type for a React component in a TypeScript project, it should always extend from `HTMLAttributes` using the correct underlying element. This ensures that standard HTML properties (like `className`, `id`, `aria-*`, etc.) are properly typed and passed through to the DOM.

## Rules

1. **Specific Elements**: Extend from the exact HTML element type when the component renders a specific DOM element.
   - For a `<button>`: `interface ButtonProps extends HTMLAttributes<HTMLButtonElement>`
   - For a `<div>`: `interface ContainerProps extends HTMLAttributes<HTMLDivElement>`

2. **Generic/Multiple Elements**: If the component can render multiple types of elements or a native element doesn't fit, use the generic `HTMLElement`.
   - `interface CustomComponentProps extends HTMLAttributes<HTMLElement>`

## Examples

### Specific Element (Button)

```tsx
import { HTMLAttributes } from "react";

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export function Button({ variant = "primary", isLoading, children, ...props }: ButtonProps) {
  return (
    <button className={`btn-${variant}`} disabled={isLoading} {...props}>
      {isLoading ? "Loading..." : children}
    </button>
  );
}
```

### Generic Element

```tsx
import { HTMLAttributes } from "react";

interface BoxProps extends HTMLAttributes<HTMLElement> {
  spacing?: number;
}

export function Box({ spacing = 4, children, ...props }: BoxProps) {
  return (
    <section className={`spacing-${spacing}`} {...props}>
      {children}
    </section>
  );
}
```

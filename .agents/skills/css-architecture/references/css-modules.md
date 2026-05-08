# CSS Modules Pattern

CSS Modules provide scoped styling by default, preventing global namespace pollution while maintaining the familiarity of standard CSS.

## Core Concepts

1. **Local Scope**: Class names are scoped locally by default.
2. **Composition**: Reuse styles from other files.
3. **Explicit Dependencies**: Styles are imported like any other module.

## File Structure

Name your CSS files with the `.module.css` extension to enable CSS Modules processing.

- Component-scoped CSS Modules should use the same `PascalCase` basename as the React component they style.
- Global or shared stylesheet files that are not tied to a single component should use `kebab-case`.

```
components/
  Button.tsx
  Button.module.css

styles/
  match-shell.css
```

## Basic Usage

### 1. Define Styles

Create a CSS file with standard CSS syntax.

```css
/* Button.module.css */
.button {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  background-color: var(--color-primary);
  color: white;
  cursor: pointer;
}

.icon {
  margin-right: 8px;
}
```

### 2. Import and Use

Import the styles object and access class names as properties.

```tsx
// Button.tsx
import styles from './Button.module.css';

export function Button({ children, icon }) {
  return (
    <button className={styles.button}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
```

## Composition

Compose styles from other classes within the same file or from other files.

```css
/* Base.module.css */
.base {
  font-family: sans-serif;
  font-size: 16px;
}

/* Button.module.css */
.primary {
  composes: base from "./Base.module.css";
  background-color: blue;
}

## Conditional Styling

Use the `cn` utility from `@/lib/utils/cn` to conditionally apply classes or join multiple classes. This replaces the need for template literals or manual string concatenation.

```tsx
import { cn } from '@/lib/utils/cn';
import styles from './Button.module.css';

export function Button({ variant = 'primary', disabled, className }) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        className
      )}
    >
      Click me
    </button>
  );
}
```

## Global Styles

Use `:global` to define global styles when necessary (use sparingly).

```css
:global(.app-root) {
  margin: 0;
}

.local-class :global(.external-lib-class) {
  color: red;
}
```

## Best Practices

1. **CamelCase**: Use camelCase for class names in CSS to make them easier to access in JS (e.g., `styles.myClass` vs `styles['my-class']`).
2. **Matching Basenames**: Keep a component stylesheet basename aligned with its component file (for example, `BaseUiPreview.tsx` and `BaseUiPreview.module.css`).
3. **Avoid Nesting**: Keep selectors flat to reduce specificity issues.
4. **Variables**: Use CSS Variables for theme values (colors, spacing, etc.).
5. **Global Styles**: Use `kebab-case` for non-module global styles such as `match-shell.css` or `design-tokens.css`.
6. **Class Composition**: Use `cn` utility for joining classes and conditional logic instead of template literals.

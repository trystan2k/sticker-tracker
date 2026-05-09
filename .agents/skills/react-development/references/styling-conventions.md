# React Styling Conventions (Padel Buddy Web)

Avoid inline styles in React components.

## Rules

- Do not use the `style` prop for component styling in normal product code.
- If a component needs styling, create or reuse a colocated CSS Module.
- Prefer semantic class names over one-off visual names.
- Keep component structure in `.tsx` files and styling concerns in `.module.css` files.
- Reserve inline styles only for exceptional framework or third-party integration cases where class-based styling is not practical.

## Preferred Pattern

```text
src/components/
  NotFoundPage.tsx
  NotFoundPage.module.css
```

```tsx
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return <main className={styles.page}>...</main>
}
```

## Do / Don't

- Do: `className={styles.page}`
- Do: create `ComponentName.module.css` for component-specific styling
- Do: share tokens and resets through global styles when needed
- Don't: `<div style={{ padding: '2rem' }}>...`
- Don't: mix layout styling into JSX with large inline style objects
- Don't: use inline styles as the default shortcut for quick UI work

## Notes

This keeps React components easier to read, makes styling reusable and testable, and aligns with the repository's CSS Modules architecture.

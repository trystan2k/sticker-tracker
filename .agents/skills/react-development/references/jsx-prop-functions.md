# JSX Prop Functions & useCallback

## Rule: `jsx-no-new-function-as-prop`

**Error**: `eslint-plugin-react-perf(jsx-no-new-function-as-prop)` - JSX attribute values should not contain functions created in the same scope.

## Problem

Inline arrow functions in JSX props cause unnecessary re-renders because a new function reference is created on every render:

```typescript
// BAD: Creates new function on every render
<Dialog.Root onOpenChange={(open) => !open && handleClearSavedMatch()}>
  <Dialog.Popup render={(popupProps) => <div {...popupProps} />} />
</Dialog.Root>
```

## Solution

Wrap inline functions in `useCallback` hooks to stabilize the function reference:

```typescript
// GOOD: Stable function reference via useCallback
const handleDialogOpenChange = useCallback(
  (open: boolean) => {
    if (!open) {
      handleClearSavedMatch()
    }
  },
  [handleClearSavedMatch]
)

const renderPopup = useCallback(
  (popupProps: HTMLAttributes<HTMLElement>) => (
    <div {...popupProps} className={styles.promptCard}>
      {/* ... */}
    </div>
  ),
  [/* dependencies */]
)

return (
  <Dialog.Root open={true} onOpenChange={handleDialogOpenChange}>
    <Dialog.Portal container={portalContainer}>
      <Dialog.Popup render={renderPopup} />
    </Dialog.Portal>
  </Dialog.Root>
)
```

## Common Cases

| Pattern | Fix |
|---------|-----|
| `onClick={() => handler()}` | `onClick={handler}` or `useCallback(handler, [])` |
| `onOpenChange={(open) => ...}` | Extract to `useCallback` |
| `render={(props) => <Component {...props} />}` | Extract to `useCallback` |
| `onChange={(e) => setState(e.target.value)}` | Use `onChange={setState}` if compatible, or `useCallback` |

## Dependencies

When extracting to `useCallback`, include all values from the enclosing scope that are used inside the function:

```typescript
// If using `t` from translations inside:
const renderTitle = useCallback(
  (titleProps) => (
    <h2 {...titleProps}>{t('title')}</h2>
  ),
  [t]  // Must include `t`
)
```

## Edge Case: Render Props with Different Signatures

Some components pass different props to render functions. Always type the parameter correctly:

```typescript
// Type from the component's types
import type { HTMLAttributes } from 'react'

const renderBackdrop = useCallback(
  (backdropProps: HTMLAttributes<HTMLElement>) => (
    <div {...backdropProps} className={styles.backdrop} />
  ),
  []
)
```

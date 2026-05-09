# React Component File Naming (Padel Buddy Web)

Use `PascalCase` for React component filenames.

## Rules

- Name component files with the exported component name, using `PascalCase`.
- Name component test files with the same `PascalCase` basename, followed by the normal test suffix.
- Keep colocated CSS Modules on the same basename as the component.

## Preferred Pattern

```text
src/components/
  BaseUiPreview.tsx
  BaseUiPreview.module.css
  NotFound.tsx

test/components/
  BaseUiPreview.browser.test.tsx
```

## Do / Don't

- Do: `BaseUiPreview.tsx`
- Do: `NotFound.tsx`
- Do: `BaseUiPreview.browser.test.tsx`
- Don't: `base_ui_preview.tsx`
- Don't: `not_found.tsx`
- Don't: `base_ui_preview.browser.test.tsx`

## Notes

This keeps filenames aligned with React component identifiers, makes imports more readable, and ensures component tests and component CSS Modules stay easy to trace.

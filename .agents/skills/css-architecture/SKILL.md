---
name: css-architecture
description: >
  Organize CSS using CSS Modules. Use when building scalable, maintainable
  styling systems with scoped styles and proper component isolation.
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://skills.sh/aj-geddes/useful-ai-prompts/css-architecture
---

# CSS Architecture

## Table of Contents

- [Overview](#overview)
- [When to Use](#when-to-use)
- [Quick Start](#quick-start)
- [Reference Guides](#reference-guides)
- [Best Practices](#best-practices)

## Overview

Build maintainable CSS systems using **CSS Modules** to ensure locally scoped styles, avoiding global namespace pollution and enabling better component isolation.

## When to Use

- Component-based styling (React, etc.)
- Large-scale applications where global CSS conflicts are a concern
- Design system development
- Multiple team collaboration
- CSS scalability and reusability

## Quick Start

Minimal working example using CSS Modules:

**Button.module.css**
```css
.button {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.primary {
  background-color: #007bff;
  color: white;
}

.primary:hover {
  background-color: #0056b3;
}
```

**Button.tsx**
```tsx
import styles from './Button.module.css';

export function Button({ type = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[type]}`}>
      {children}
    </button>
  );
}
```

## Reference Guides

Detailed implementations in the `references/` directory:

| Guide | Contents |
|---|---|
| [CSS Modules Pattern](references/css-modules.md) | CSS Modules Pattern |
| [CSS Variables (Custom Properties)](references/css-variables-custom-properties.md) | CSS Variables (Custom Properties) |

## Best Practices

### ✅ DO

- Use `.module.css` extension for component styles
- Use camelCase for class names to easily access them in JS
- Co-locate CSS files with their components
- Use CSS Variables for theme values (colors, spacing, etc.)

### ❌ DON'T

- Use global styles unless absolutely necessary
- Nest selectors deeply (keep them flat)
- Use ID selectors for styling

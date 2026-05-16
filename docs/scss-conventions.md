# SCSS Conventions

The styling goal is simple: consistent themes, minimal duplication, and no surprise visual changes.

## Principles

- Prefer SCSS classes over inline styles.
- Use CSS custom properties for theme-aware values.
- Keep component styles close to the component.
- Keep global styles small and intentional.
- Avoid hardcoded colors when a theme variable exists.
- Do not change UI appearance during style refactors.

## Recommended Style Structure

```text
src/shared/styles/
  abstracts/
    _variables.scss
    _theme-maps.scss
    _mixins.scss
    _breakpoints.scss

  base/
    _reset.scss
    _globals.scss
    _typography.scss

  themes/
    theme.scss

  utilities/
    _layout.scss
    _skeleton.scss
    _state.scss

  vendors/
    _bootstrap-overrides.scss

  index.scss
```

The current `src/styles` files can be migrated into this structure gradually.

## Theme Variables

Use semantic names:

```scss
--color-body-bg
--color-surface
--color-surface-muted
--color-text
--color-text-muted
--color-heading
--color-border
--color-primary
--color-primary-soft
--color-accent
--color-danger
--color-success
--color-warning
--color-info
--shadow-panel
--shadow-panel-hover
```

During migration, keep existing variable aliases:

```scss
--body-bg-color: var(--color-body-bg);
--surface-color: var(--color-surface);
--text-color: var(--color-text);
--border-color: var(--color-border);
--panel-shadow: var(--shadow-panel);
```

This avoids visual regressions.

## Component SCSS

Use one root class per component:

```scss
.vehicle-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);

  &__title {
    color: var(--heading-color);
  }

  &--inactive {
    opacity: 0.7;
  }
}
```

Avoid broad selectors:

```scss
div h2 {
  color: #13232b;
}
```

## Inline CSS Removal

Remove inline CSS in this order:

1. Static spacing, color, and layout styles.
2. Repeated skeleton styles.
3. Modal and drawer spacing.
4. Badge colors.
5. Dynamic values using CSS variables.

For dynamic values:

```jsx
<div className="progress-bar" style={{ '--progress': `${percent}%` }} />
```

```scss
.progress-bar {
  width: var(--progress);
}
```

## Responsive Rules

- Use shared breakpoints.
- Prefer grid/flex layouts with `minmax(0, 1fr)`.
- Do not scale font size with viewport width.
- Keep buttons and controls stable across breakpoints.
- Put responsive behavior inside the component SCSS when possible.

Suggested breakpoints:

```scss
xs: 340px
sm: 520px
md: 720px
lg: 960px
xl: 1200px
```

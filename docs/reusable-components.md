# Reusable Component Guidelines

Reusable components should make the app easier to maintain, not harder to understand.

## When To Extract

Extract a component when:

- The same UI appears in multiple places.
- A page file is becoming too large.
- The component has one clear responsibility.
- The extraction does not change markup or behavior.

Do not extract just to create abstraction.

## Where Components Belong

Feature-specific components:

```text
features/bookings/components/BookingCard.jsx
features/vehicles/components/VehicleForm.jsx
```

Shared components:

```text
shared/components/modals/ConfirmModal.jsx
shared/components/loading/SkeletonCard.jsx
shared/components/empty-state/EmptyState.jsx
```

Start inside the feature. Promote to `shared` only when at least two features need it.

## Good Shared Candidates

- `ConfirmModal`
- `EmptyState`
- `SkeletonCard`
- `SkeletonRow`
- `StatusBadge`
- `FilterTabs`
- `SearchInput`
- `MetricCard`
- `SideDrawer`

## Component Rules

- Use functional components.
- Keep props simple and explicit.
- Avoid hidden API calls inside presentational components.
- Avoid feature-specific imports in shared components.
- Keep styling in SCSS.
- Preserve class names during first extraction when refactoring existing UI.

## Suggested Component Shape

```text
ComponentName/
  ComponentName.jsx
  ComponentName.scss
```

For very small components, a single file is acceptable:

```text
shared/components/loading/SkeletonRow.jsx
```

Use the simpler option until the component grows.

## Presentational vs Container

Presentational components:

- receive data via props
- render UI
- do not fetch data
- do not know routes unless navigation is part of the component contract

Container/page components:

- fetch data
- own page-level state
- call services/hooks
- decide navigation

## Refactor-Safe Extraction

When extracting existing UI:

1. Copy the JSX into a new component.
2. Keep the same classes and element order.
3. Pass the same values as props.
4. Move no business logic unless necessary.
5. Validate the page visually.
6. Only then consider simplifying props or styles.

## Props

Prefer clear props:

```jsx
<ConfirmModal
  title="Remove vehicle"
  message="This vehicle will be moved to inactive vehicles."
  confirmLabel="Remove"
  submitting={submitting}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

Avoid unclear spread props for shared components:

```jsx
<ConfirmModal {...modalState} />
```

## Accessibility

Reusable components should include basic accessibility:

- buttons use `type="button"` unless submitting a form
- modals use `role="dialog"` and `aria-modal="true"`
- icon-only buttons have `aria-label`
- interactive rows support keyboard behavior when practical

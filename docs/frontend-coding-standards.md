# Frontend Coding Standards

These standards keep the React codebase predictable, safe to refactor, and friendly for new developers.

## React

- Use functional components only.
- Keep components small and purpose-driven.
- Prefer composition over large components.
- Keep business logic out of presentational components.
- Avoid duplicated JSX by extracting components.
- Avoid changing behavior during cleanup refactors.

## Pages

Pages should:

- Load data.
- Own page-level state.
- Compose feature components.
- Handle navigation for that page.

Pages should not:

- Contain many reusable subcomponents.
- Contain repeated formatting/status logic.
- Contain large chunks of unrelated UI.

## Hooks

Create hooks when logic repeats or when a page becomes hard to read.

Good hook examples:

- `useVehicles`
- `useBookings`
- `useInvoices`
- `useAsyncAction`
- `useDisclosure`

Hook rules:

- Hooks may call services.
- Hooks should return plain state and actions.
- Hooks should not render JSX.
- Keep feature hooks inside the feature first.

## Services

- Keep API calls outside UI components.
- Preserve endpoint paths, payloads, and response handling.
- Use the shared API client for authenticated requests.
- Do not import React components into services.
- Do not duplicate the same service under multiple names.

## State

Use local state for page-only UI state:

- modal open/closed
- selected item
- current filter
- form draft
- loading/submitting flags

Use Redux only for app-wide state:

- authenticated user
- auth initialization
- global theme
- truly shared app state

Avoid moving server data into Redux unless multiple distant features need it.

## Error Handling

- Use existing toast patterns.
- Keep current error messages during refactors.
- Do not swallow errors silently unless the existing behavior already does.
- Do not change auth/session error handling casually.

## Validation Before Finishing

Run what is relevant:

```bash
npm run build
```

```bash
.\node_modules\.bin\eslint.cmd src
```

Also manually check any affected role flow.

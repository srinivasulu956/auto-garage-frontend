# Architecture

AutoFix uses a role-based React architecture. The current app is organized around admin, customer, and mechanic workflows.

## Goals

- Keep features independent.
- Keep shared code reusable and generic.
- Avoid changing behavior during refactors.
- Make it easy for multiple developers to work without touching the same files.

## Current Layers

```text
src/
  app/        pages, routing, layout, role UI
  app-core/   services, store, actions, shared components
  styles/     theme variables
```

## Target Direction

Move gradually toward feature-based modules:

```text
src/
  app/        app shell, providers, routing, layout
  features/   business features
  shared/     reusable UI, hooks, utilities, styles
  services/   shared API client/session utilities
  store/      global Redux setup
```

This is a migration direction, not a requirement to move everything at once.

## Core Rules

- Pages compose components; they should not contain large amounts of reusable UI.
- Feature-specific components stay inside the feature.
- Shared components must not depend on feature-specific code.
- API contracts and route paths must not change during refactors.
- Authentication/session behavior is high risk and should be changed only with clear validation.

## Dependency Direction

Allowed:

```text
app -> features
app -> shared
features -> shared
features -> services
features -> store
shared -> shared
```

Avoid:

```text
features/bookings -> features/vehicles
shared -> features/*
services -> UI components
```

If two features need the same logic, move it to `shared`.

## Refactor Approach

Use small steps:

1. Extract constants and formatters.
2. Extract presentational components.
3. Extract feature hooks.
4. Move files into feature folders.
5. Clean route/nav metadata.

Validate after each step.

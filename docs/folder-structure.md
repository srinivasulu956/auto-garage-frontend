# Folder Structure Guidelines

The project should move gradually toward feature-based architecture. Do not reorganize everything in one pass.

## Current Structure

```text
src/
  app/
  app-core/
  styles/
```

## Recommended Target Structure

```text
src/
  app/
    providers/
    routes/
    layout/

  features/
    bookings/
      pages/
      components/
      hooks/
      services/
      constants/
      styles/

    vehicles/
    invoices/
    service-types/
    staff/
    users/
    mechanic-jobs/
    dashboard/
    auth/

  shared/
    components/
    hooks/
    services/
    constants/
    utils/
    styles/

  store/
```

## Example Feature Module

```text
features/vehicles/
  pages/
    VehiclesPage.jsx
    VehiclesPage.scss
  components/
    VehicleCard.jsx
    VehicleForm.jsx
    VehicleEmptyState.jsx
  hooks/
    useVehicles.js
    useVehicleForm.js
  services/
    vehicleService.js
  constants/
    vehicleConstants.js
```

Feature modules should be usable without importing from another feature module.

## Folder Purposes

### `app`

Application shell:

- root app composition
- providers
- route setup
- layout
- protected route handling

### `features`

Business modules. Each feature should be able to evolve mostly independently.

Each feature may contain:

- `pages`: route-level screens
- `components`: feature-only UI
- `hooks`: feature data and UI logic
- `services`: feature API calls
- `constants`: feature metadata
- `utils`: feature-only helpers
- `styles`: feature-level SCSS if needed

### `shared`

Generic code used by multiple features.

Shared code must not depend on a feature.

### `store`

Global Redux setup and app-wide slices.

## Naming Conventions

- Components: `PascalCase.jsx`
- Pages: `SomethingPage.jsx`
- Hooks: `useSomething.js`
- Services: `somethingService.js`
- Constants: `somethingConstants.js` or domain-specific names like `bookingStatuses.js`
- SCSS: match the component/page name when possible
- Folders: kebab-case for multi-word feature folders

## Import Rules

Allowed:

- feature imports from itself
- feature imports from `shared`
- feature imports from `store`
- feature imports from shared services

Avoid:

- feature importing from another feature
- shared importing from a feature
- services importing UI

If a feature needs code from another feature, move the common piece into `shared`.

## Migration Rule

When moving files:

1. Move one feature at a time.
2. Keep names and behavior the same.
3. Update imports only for that move.
4. Build and lint after the move.

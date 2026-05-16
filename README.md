# AutoFix Frontend

AutoFix is a garage management frontend built with React, Vite, Redux Toolkit, Bootstrap, and SCSS.

The app supports three main roles:

| Role | Main Areas |
| --- | --- |
| Admin | Dashboard, bookings, services, staff, customers |
| Customer | Dashboard, vehicles, bookings, invoices, profile |
| Mechanic | Dashboard, assigned jobs, work logs, profile |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Running AutoFix backend API

### Install

```bash
npm install
```

### Environment

Create a local environment file based on the backend URL used by your machine.

Required variables:

```text
VITE_API_BASE_URL=https://localhost:7224/api
VITE_AUTH_BASE_URL=https://localhost:7224/api/Auth
```

Do not commit `.env*` files.

### Run Locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

If generated build files cause lint noise, lint source files directly:

```bash
.\node_modules\.bin\eslint.cmd src
```

## Project Documentation

- [Architecture](docs/architecture.md)
- [Frontend Coding Standards](docs/frontend-coding-standards.md)
- [Folder Structure Guidelines](docs/folder-structure.md)
- [SCSS Conventions](docs/scss-conventions.md)
- [Reusable Component Guidelines](docs/reusable-components.md)

## Development Principles

- Preserve existing behavior unless a change is explicitly requested.
- Prefer feature-based organization.
- Keep shared code generic and reusable.
- Keep feature-specific code inside its feature.
- Avoid cross-feature imports.
- Use SCSS and theme variables instead of inline CSS.
- Validate with build, lint, and focused manual checks.

## Git

Repository ownership rules are defined in [AGENTS.md](AGENTS.md). Git operations, branching, and deployments are handled by the repository owner.

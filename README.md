# AutoFix — Garage Management Portal

A garage management system for customers, admins and mechanics — with an **AI assistant that lets customers run the entire portal by conversation** instead of navigating tabs and filling forms.

React 19 + Vite frontend. The API lives in a separate repository, `Auto-Garage-Solution` (ASP.NET Core, .NET 10).

---

## What it does

Three roles share one workflow. A booking moves through a ten-stage lifecycle from _Pending_ to _Paid_, and each role can only advance the stages it owns.

| Role         | What they do                                                                               |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Customer** | Register vehicles, book services, track repair progress, view and pay invoices             |
| **Admin**    | Confirm bookings, assign mechanics, manage the service catalogue and staff, raise invoices |
| **Mechanic** | See assigned jobs, log work and parts, advance repair status                               |

### The AI assistant

A customer types _"my brakes are squealing"_ and the assistant reads the **live service catalogue**, recommends the right service at the real price, checks which of their vehicles is free, and prepares the booking for one-click approval.

It runs entirely server-side using **LLM tool calling**, and it is deliberately constrained:

- It **cannot see another customer's data** — no tool accepts a customer id; identity is injected from the JWT
- It **cannot write anything** without an explicit human confirmation click
- It **cannot take payments** or advance a booking past _Pending_

→ **[Read the AI implementation guide](docs/05-ai-assistant.md)**

---

## Documentation

Full documentation lives in [`docs/`](docs/README.md).

| Document                                        | Contents                                                  |
| ----------------------------------------------- | --------------------------------------------------------- |
| [Project Overview](docs/01-project-overview.md) | The product, roles, booking lifecycle, end-to-end journey |
| [Architecture](docs/02-architecture.md)         | System design, auth flow, data model, key trade-offs      |
| [Backend Guide](docs/03-backend.md)             | .NET structure, layering, full API reference              |
| [Frontend Guide](docs/04-frontend.md)           | React structure, routing, state, theming                  |
| [**AI Assistant**](docs/05-ai-assistant.md)     | **Tool calling, safety design, real debugging stories**   |
| [Setup & Run](docs/06-setup-and-run.md)         | Running it on a fresh machine                             |

<!-- | [KT Guide](docs/07-KT-guide.md) | Talking points and honest weaknesses | -->

---

## Tech stack

|             |                                             |
| ----------- | ------------------------------------------- |
| **UI**      | React 19, React Router 7, Bootstrap 5, SCSS |
| **State**   | Redux Toolkit                               |
| **Forms**   | react-hook-form                             |
| **Build**   | Vite 8                                      |
| **Quality** | ESLint 9 + Prettier                         |

Route-level code splitting via `lazy()`, so a customer never downloads admin bundles. Theming uses CSS custom properties, so light and dark mode swap values rather than stylesheets.

---

## Getting started

**Prerequisites:** Node.js 20+, and the backend running on `https://localhost:7224`.

```bash
npm install
```

Create `.env` from the template:

```bash
cp .env.example .env
```

```
VITE_API_BASE_URL=https://localhost:7224/api
VITE_AUTH_BASE_URL=https://localhost:7224/api/Auth
```

> ⚠️ **Never put an AI provider key in a `VITE_`-prefixed variable.** Vite inlines them into the JavaScript bundle at build time, making them readable by anyone. All AI calls go through the backend.

```bash
npm run dev
```

Runs at **http://localhost:7600**. Vite proxies `/api` to the backend so requests appear same-origin, which is what lets the HTTP-only refresh cookie work in development.

Full instructions, including database setup and first-run steps: **[Setup & Run](docs/06-setup-and-run.md)**.

### Scripts

```bash
npm run dev           # dev server
npm run build         # production build
npm run lint          # eslint
npm run preview       # preview a production build
```

---

## Branching

- `main` — stable
- `develop` — active development
- `feature/*` — individual features

Always raise a PR to `develop`. Never push directly to `main` or `develop`.

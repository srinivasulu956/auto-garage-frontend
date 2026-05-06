# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# AutoGarage Frontend

A garage management web app built with React + Vite.

## Tech Stack

- React 18
- Redux
- Bootstrap + SCSS
- Vite

## Prerequisites

- [Node.js](https://nodejs.org) (v18 or above)

## Getting Started

### Step 1: Clone the repo

git clone https://github.com/srinivasulu956/auto-garage-frontend.git

### Step 2: Install dependencies

cd AutoFix
npm install

### Step 3: Configure environment

Create a `.env.local` file in the root folder:
VITE_API_BASE_URL=https://localhost:7224/api

> Make sure the backend is running on port 7224
> before starting the frontend.

### Step 4: Run the project

npm run dev

App runs at: http://localhost:7600

## Roles

| Role     | Features                                     |
| -------- | -------------------------------------------- |
| Admin    | Dashboard, bookings, users, mechanics        |
| Customer | Book service, manage vehicles, view invoices |
| Mechanic | View assigned jobs, update job status        |

## Branching Strategy

- `main` — stable production code
- `develop` — active development branch
- `feature/*` — individual feature branches

Always raise a PR to `develop`. Never push directly to
`main` or `develop`.

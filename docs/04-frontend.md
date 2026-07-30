# Frontend Guide — AutoFix

**Repository:** `AutoFix` · **Stack:** React 19, Vite 8, Redux Toolkit, React Router 7, SCSS

---

## 1. Dependencies

| Package                            | Version    | Why                                |
| ---------------------------------- | ---------- | ---------------------------------- |
| `react` / `react-dom`              | 19.2       | UI                                 |
| `react-router-dom`                 | 7.13       | Routing, via `createBrowserRouter` |
| `@reduxjs/toolkit` + `react-redux` | 2.11 / 9.2 | Auth and theme state               |
| `react-hook-form`                  | 7.72       | Forms with minimal re-renders      |
| `react-toastify`                   | 11.0       | Notifications                      |
| `bootstrap`                        | 5.3        | Layout and utility classes         |
| `sass`                             | 1.98       | SCSS                               |
| `vite`                             | 8.0        | Dev server and build               |
| `eslint` + `prettier`              | 9.39 / 3.0 | Linting and formatting             |

**No AI SDK and no markdown library.** Both are deliberate — the AI runs entirely server-side, and the chat renders markdown with a ~90-line component instead of a dependency. → [05 §10](05-ai-assistant.md#10-the-frontend-chat-experience)

### Scripts

```bash
npm run dev           # dev server
npm run build         # production build
npm run stage-build   # build with the stage env
npm run qa-build      # build with the qa env
npm run lint          # eslint
npm run preview       # preview a production build
```

---

## 2. Build configuration

`vite.config.js` carries three things worth knowing:

**Path aliases** — so deep imports stay readable:

| Alias       | Resolves to     |
| ----------- | --------------- |
| `@`         | `/src`          |
| `@app`      | `/src/app`      |
| `@app-core` | `/src/app-core` |
| `@assets`   | `/src/assets`   |

**Dev server on port 7600**, opening automatically.

**An API proxy** — `/api` is proxied to `https://localhost:7224` with `secure: false` to accept the backend's self-signed development certificate. The reason matters: it makes requests appear **same-origin**, which is what allows the HTTP-only refresh cookie to work in development without `SameSite` blocking it.

There is also `define: { global: 'window' }`, a shim for older libraries expecting a Node-style `global`.

---

## 3. Folder structure

```
src/
├── App.jsx            router tree + providers  ← start here
├── main.jsx           React root
├── index.scss         global styles, CSS custom properties, theming
│
├── app/               screens, grouped by role
│   ├── admin/         7 areas
│   ├── customer/      6 areas (including AIChat)
│   ├── mechanic/      4 areas
│   ├── auth-provider/ session restore on boot
│   ├── layout/        MainLayout shell
│   ├── login/         login + registration
│   ├── routes/        ProtectedRoute
│   ├── headers/, side-nav-bar/, breadcrumb-header/
│   ├── form-inputs/
│   ├── unauthorized/, page-not-found/
│
├── app-core/          cross-app plumbing
│   ├── services/      API layer — 11 files
│   ├── reducers/      store.js, common-slice.js
│   ├── actions/       auth-actions.js
│   └── constants/
│
└── shared/
    ├── components/    loading-page, side-drawer, status-badge, theme-toggler
    ├── data-modals/
    └── utils/
```

**The `app` / `app-core` / `shared` split:** `app` is what the user sees, `app-core` is how the app talks to the server and holds global state, `shared` is reusable UI with no feature knowledge. A component in `shared` must not import from `app`.

---

## 4. Routing

One router tree in `App.jsx`. Three role branches, each guarded:

```jsx
{
    path: '/customer',
    element: (
        <ProtectedRoute allowedRoles={['customer']}>
            <MainLayout />
            <AIChat />
        </ProtectedRoute>
    ),
    children: [ /* dashboard, vehicles, bookings, invoices, details */ ],
}
```

| Path            | Role      | Screens                                                                                     |
| --------------- | --------- | ------------------------------------------------------------------------------------------- |
| `/`, `/login`   | Anonymous | Login and registration                                                                      |
| `/customer/*`   | customer  | dashboard · vehicles · bookings · bookings/new · bookings/:id · invoices · details          |
| `/admin/*`      | admin     | dashboard · bookings · bookings/:id · services · staff · customers · customer/:id · details |
| `/mechanic/*`   | mechanic  | dashboard · jobs · jobs/:id · details                                                       |
| `/unauthorized` | Any       | Wrong-role landing                                                                          |
| `*`             | Any       | 404                                                                                         |

Each branch redirects its index to `dashboard`.

**Note where `<AIChat />` sits** — a sibling of `<MainLayout />` inside the customer branch, not inside a page. That is why the assistant is a docked panel available on every customer screen but never rendered for admins or mechanics.

### Code splitting

Every page is `lazy()`-loaded behind a `<Suspense>` with a shared loading screen:

```jsx
const withPageLoader = (element) => <Suspense fallback={<LoadingPage />}>{element}</Suspense>;
```

A customer never downloads admin bundles. **A worthwhile KT point:** this is a performance win _and_ a modest security one — the admin UI is not sitting in a customer's browser.

### ProtectedRoute

`src/app/routes/protected-route.jsx` runs three checks in order:

1. **No token** → clear Redux state (in an effect, not during render) and redirect to `/login`.
2. **Token but user not loaded yet** → render `null`, so a role check never runs against missing data.
3. **Role not in `allowedRoles`** → redirect to `/unauthorized`.

That middle state is the subtle one. Without it, a page flashes or bounces to `/unauthorized` while the profile request is still in flight.

> **This is UX, not security.** The real enforcement is `[Authorize(Roles = …)]` on the server. Editing Redux state in DevTools would reveal an admin screen shell — and every API call behind it would return 403.

---

## 5. State management

One slice, `commonState` (`src/app-core/reducers/common-slice.js`):

```js
{
    loggedUserData: null,     // profile + role, null when signed out
    authInitialized: false,   // has the session-restore attempt finished?
    theme: 'light',
}
```

Actions: `setLoggedUserData` · `setAuthInitialized` · `setThemeData` · `clearLoggedUserData`.

**What is deliberately _not_ in Redux:** all server data — vehicles, bookings, invoices. Each screen fetches what it needs into local state.

The trade-off, stated plainly: navigating back to a list refetches it. For an app this size that is simpler than a cache, and always-correct data beats stale data. If it grew, RTK Query or React Query would be the answer — not more slices.

`authInitialized` exists because "not logged in" and "we haven't checked yet" are different states. `AuthInitializer` wraps the router and attempts a session restore before the first route renders.

---

## 6. The API layer

Every request goes through `src/app-core/services/api-client.js`. Feature services are thin wrappers:

| Service                    | Covers                                               |
| -------------------------- | ---------------------------------------------------- |
| `api-client.js`            | The core: auth headers, refresh, error normalisation |
| `auth-request.js`          | Token storage, refresh call, default headers         |
| `user-services.js`         | Login, register, profile                             |
| `vehicle-service.js`       | Customer garage                                      |
| `booking-service.js`       | Customer bookings                                    |
| `service-type-service.js`  | Catalogue                                            |
| `admin-booking-service.js` | Admin bookings                                       |
| `admin-user-service.js`    | Admin users and staff                                |
| `mechanic-service.js`      | Mechanic jobs and work logs                          |
| `assistant-service.js`     | AI assistant                                         |
| `toast-service.js`         | Notifications                                        |

### What `api-client` handles

**Auth header** — attaches the stored token; throws immediately with a clear message if there is none.

**403** — clears the session and throws _"Access denied. Session terminated."_

**401 → silent refresh → retry once.** The important detail is that concurrent 401s share one refresh:

```js
const getRefreshedToken = async () => {
	if (!refreshPromise) {
		// Multiple API calls can fail with 401 at once. Share one refresh request,
		// then let every waiting request retry with the same new access token.
		refreshPromise = refreshAccessToken().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
};
```

Without this, a dashboard firing four requests when the token expires sends four refresh calls, and whichever lands last wins — the other three may already have been rotated out. **This is a good thing to be asked about.** The `retried` flag ensures one retry only, so a genuinely expired session ends in a clean logout rather than a loop.

**Error normalisation** — `parseErrorMessage` unwraps ASP.NET validation dictionaries, arrays, and `{ message }` bodies into a single readable string, falling back to the status code. This is why the AI assistant's _"used up its usage allowance"_ message reaches the chat window with no extra frontend code.

---

## 7. Screens by role

### Customer

| Screen             | What it does                                                                     |
| ------------------ | -------------------------------------------------------------------------------- |
| **Dashboard**      | Summary of vehicles, active bookings, outstanding invoices                       |
| **Vehicles**       | Garage list, add/edit, soft delete, restore removed vehicles                     |
| **Bookings**       | List with status badges; a vehicle already in service is blocked from re-booking |
| **New booking**    | Pick vehicle → service → date → notes                                            |
| **Booking detail** | Full status timeline — who changed what, when                                    |
| **Invoices**       | List, line-item detail, pay                                                      |
| **Details**        | Profile                                                                          |
| **AIChat**         | The assistant, docked on every screen → [05](05-ai-assistant.md)                 |

### Admin

Dashboard · Bookings (with detail: confirm, assign, reassign, advance status) · Services management (CRUD, deactivate, restore) · Staff management · Customers (with per-customer detail) · Details.

### Mechanic

Dashboard · Jobs · Job detail (advance status, add work-log entries) · Details.

---

## 8. Styling and theming

**SCSS with CSS custom properties.** Colours are defined as variables on `:root` — `--surface-color`, `--border-color`, `--primary-color`, `--muted-text-color`, `--danger-color`, `--success-color` — and dark mode swaps the values, not the stylesheets.

```scss
.action-card {
	background: var(--surface-color);
	border: 1px solid var(--border-color);
}
```

**The rule:** never hardcode a hex value in a component. The AI chat panel originally did — `$primary-color: #2563eb`, `$user-msg-bg: #e0e7ff` — and looked broken in dark mode. Rewriting it against the custom properties fixed the theme _and_ halved the stylesheet.

`theme-toggler` in `shared/components` flips the theme; the choice lives in Redux and persists with the user profile.

Layout uses Bootstrap 5 utility classes with component-scoped SCSS on top — component styles sit beside their component (`AIChat.jsx` + `AIChat.scss`).

---

## 9. Conventions

- **Files** kebab-case (`booking-detail-page.jsx`); the AIChat folder is the one exception.
- **Components** PascalCase, default-exported.
- **Feature folders** own their SCSS.
- **Tabs** for indentation, single quotes, semicolons — enforced by Prettier through ESLint.
- **Comments explain _why_, not _what_.** The codebase leans on this rather than JSDoc.

---

## 10. Known rough edges

- `src/app/form-inputs/` is empty — a planned shared input kit that never landed.
- No tests. Vitest + React Testing Library would be the natural choice.
- Refetch-on-navigate is fine now but is the first thing that would need a cache.
- `loggedUserData` is read with a fallback for both `firstName` and `FirstName`, hinting at a casing inconsistency between endpoints worth resolving.

---

_Next: [AI Assistant](05-ai-assistant.md) · [Setup & Run](06-setup-and-run.md)_

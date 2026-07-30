# Architecture

## 1. The shape of the system

```
┌──────────────────────────────┐
│  AutoFix  (React 19 + Vite)  │   SPA — browser
│  Redux Toolkit · Router 7    │
└──────────────┬───────────────┘
               │  HTTPS · JSON
               │  Authorization: Bearer <JWT>
               │  refresh token in HTTP-only cookie
               ▼
┌──────────────────────────────┐
│  Auto-Garage  (.NET 10 API)  │
│                              │
│  Controllers   ← HTTP, auth  │
│  Services      ← business    │
│  Repositories  ← data access │
└──────┬──────────────┬────────┘
       │              │
       ▼              ▼
┌────────────┐  ┌──────────────┐      ┌─────────────────┐
│ AutoGarage │  │AutoGarageAuth│      │  AI provider    │
│    (SQL)   │  │    (SQL)     │      │  Groq / OpenAI  │
│ business   │  │ identity     │      └────────▲────────┘
└────────────┘  └──────────────┘               │
                                    server-side only ─┘
```

Two separate SPAs are not needed — one React app serves all three roles, switching layout and navigation by role.

---

## 2. Backend layering

Three layers, strictly ordered. A controller never touches `DbContext`; a repository never contains business rules.

| Layer          | Responsibility                                                             | Example             |
| -------------- | -------------------------------------------------------------------------- | ------------------- |
| **Controller** | HTTP concerns only: routing, `[Authorize]`, model validation, status codes | `BookingController` |
| **Service**    | Business rules, validation, orchestration, DTO mapping                     | `BookingService`    |
| **Repository** | Data access — EF Core queries and persistence                              | `BookingRepository` |

**The convention that matters most:** every customer-facing service method takes `customerId` as its **first parameter** and scopes its query by it.

```csharp
Task<BookingDto> GetByIdAsync(Guid bookingId, string customerId);
```

Ownership is not checked in the controller and hoped for in the service — it is _part of the query_. Asking for someone else's booking returns nothing, because the row was never in the result set.

> This convention is why the AI assistant was safe to build. It calls exactly these methods, with the id taken from the JWT. There was no need to invent a new permission model for the AI. → [05 §5](05-ai-assistant.md#5-security-how-it-cannot-leak-another-customers-data)

---

## 3. Why two databases

| Database         | Context                   | Holds                                                                     |
| ---------------- | ------------------------- | ------------------------------------------------------------------------- |
| `AutoGarageAuth` | `AutoGarageAuthDbContext` | ASP.NET Identity tables, users, roles, refresh tokens, blacklisted tokens |
| `AutoGarage`     | `AutoGarageDbContext`     | Vehicles, service types, bookings, status history, invoices, work logs    |

Identity brings a large, opinionated schema of its own. Keeping it in its own database keeps the business schema clean and its migrations independent — an Identity upgrade cannot disturb the booking tables.

**The trade-off, stated honestly:** there is no foreign key from a booking to a user. `CustomerId` is a plain string holding the Identity user id, and referential integrity across that boundary is the application's job, not the database's. At this scale that is an acceptable price for the separation; at a larger scale it would need reconsidering.

---

## 4. Authentication and authorization

### The flow

```
1. POST /api/auth/login  { email, password }
        │
        ▼
2. Identity verifies the password
        │
        ▼
3. Server returns:
        • access token  — JWT, 15 minutes, in the response body
        • refresh token — 7 days, HTTP-only Secure SameSite=None cookie
        │
        ▼
4. Every request sends  Authorization: Bearer <access token>
        │
        ▼
5. On 401, the client silently calls POST /api/auth/refresh
   (the cookie rides along automatically) and retries once
        │
        ▼
6. On logout the access token is blacklisted and the cookie cleared
```

### The JWT

Signed **HS256**, 15-minute lifetime, issued in `Repositories/TokenRepository/TokenRepository.cs`. Claims:

| Claim                       | Used for                                          |
| --------------------------- | ------------------------------------------------- |
| `ClaimTypes.NameIdentifier` | The user id — **the scoping key for every query** |
| `ClaimTypes.Name`           | Username                                          |
| `ClaimTypes.Email`          | Email                                             |
| `FirstName`, `LastName`     | Display, and the assistant's greeting             |
| `ClaimTypes.Role`           | `Admin` / `Customer` / `Mechanic`                 |

### Why short-lived access + long-lived refresh

A JWT cannot be revoked — that is the point of a stateless token, and also its weakness. Keeping it to 15 minutes bounds the damage from a leaked token. The refresh token is long-lived but stored server-side, so it _can_ be revoked, and lives in an HTTP-only cookie where JavaScript (and therefore XSS) cannot read it.

### Token blacklist

Logout would otherwise be meaningless — the access token stays valid until it expires. `Middlewares/TokenBlacklistMiddleware.cs` rejects blacklisted tokens, and `BackgroundServices/TokenCleanupService.cs` purges expired entries so the table does not grow forever.

_"Logout has to invalidate something. With stateless JWTs the only options are a very short lifetime or a revocation list — I used both, and a background job to keep the list from growing unbounded."_

### Middleware order

From `Program.cs`:

```
UseSerilogRequestLogging
UseCors("AllowFrontend")
UseAuthentication          ← who are you?
ExceptionHandlerMiddleware
TokenBlacklistMiddleware   ← is your token still valid?
UseAuthorization           ← are you allowed?
MapControllers
```

Order is not cosmetic: the blacklist check must run **after** authentication (it needs the parsed token) and **before** authorization.

---

## 5. Data model

```
AutoGarageUser (Identity)
    │
    │ CustomerId (string, cross-database)
    │
    ├──< Vehicle ────────────┐
    │      make, model, year │
    │      licensePlate      │
    │      isActive          │
    │                        │
    └──< ServiceBooking >────┘
           │  scheduledDate, status
           │  BookedBasePrice   ← price snapshot
           │  customerNotes
           │
           ├──< BookingStatusHistory   (append-only audit trail)
           ├──< JobWorkLog             (mechanic's record)
           └──── Invoice
                    │
                    └──< InvoiceLineItem

ServiceType ──< ServiceBooking
   name, basePrice, estimatedHours, isActive
```

### Two decisions worth explaining

**Price snapshotting.** `ServiceBooking.BookedBasePrice` copies the service price at booking time. Without it, a price change would retroactively alter every historical booking and invoice. _(This field was the subject of a real bug — see [05 §8.4](05-ai-assistant.md#84-a-pre-existing-bug-the-ai-exposed).)_

**Soft deletes.** Vehicles and service types carry `IsActive` and are deactivated rather than removed. A deleted service would orphan every booking that referenced it.

---

## 6. Cross-cutting concerns

| Concern         | How                                                                                             | Where                                       |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Errors          | One middleware turns unhandled exceptions into consistent JSON; no stack traces leak to clients | `Middlewares/ExceptionHandlerMiddleware.cs` |
| Logging         | Serilog to console and rolling daily files, with a separate error log                           | `Program.cs`, `Logs/`                       |
| Validation      | Data annotations on DTOs, checked via `ModelState`; business rules in services                  | Controllers + Services                      |
| CORS            | Named `AllowFrontend` policy with credentials enabled — required for the refresh cookie         | `Program.cs`                                |
| Docs            | Swagger/OpenAPI in Development                                                                  | `Program.cs`                                |
| Background work | Hosted service purging expired tokens                                                           | `BackgroundServices/TokenCleanupService.cs` |

**The logs earned their keep.** Both AI integration bugs were diagnosed by reading `Logs/error-*.txt` — the browser only ever showed a generic 503. → [05 §8](05-ai-assistant.md#8-war-stories--real-bugs-and-what-they-taught)

---

## 7. Frontend architecture in one page

| Folder          | Holds                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| `src/app/`      | Screens and features, grouped by role (`admin/`, `customer/`, `mechanic/`) |
| `src/app-core/` | Cross-app plumbing — API services, Redux store, actions, constants         |
| `src/shared/`   | Reusable UI and utilities used by any role                                 |

- **Routing** — one `createBrowserRouter` tree in `App.jsx`, with `/admin`, `/customer` and `/mechanic` branches each wrapped in `<ProtectedRoute allowedRoles={[…]}>`. Pages are `lazy()`-loaded so a customer never downloads admin code.
- **State** — a single Redux slice (`commonState`) holding `loggedUserData`, `authInitialized` and `theme`. Everything else is local component state. Server data is fetched per screen, not cached globally.
- **API access** — all traffic goes through `api-client.js`, which attaches the token, handles refresh-on-401 with a shared in-flight promise, and normalises error messages.

→ [Frontend Guide](04-frontend.md)

---

## 8. Key decisions, with their trade-offs

| Decision                          | Why                                               | What it costs                         |
| --------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Two databases                     | Identity schema stays isolated                    | No FK across the boundary             |
| Layered, no CQRS/MediatR          | Readable, matches the size of the domain          | More boilerplate per feature          |
| Repositories over raw `DbContext` | Testable seam, services stay persistence-agnostic | An extra layer that is thin in places |
| Redux for auth only               | Avoids a cache layer nothing needed               | Repeated fetches across screens       |
| Short JWT + refresh cookie        | Bounded exposure, revocable sessions              | Refresh plumbing to get right         |
| Soft deletes                      | History survives                                  | Every query must filter `IsActive`    |
| Stateless AI conversations        | No new tables, no migrations                      | History is re-sent, costing tokens    |
| Provider-agnostic AI client       | Swapping model/provider is config                 | No vendor SDK conveniences            |

---

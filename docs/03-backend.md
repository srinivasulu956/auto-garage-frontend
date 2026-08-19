# Backend Guide — Auto-Garage API

**Repository:** `Auto-Garage-Solution` · **Project:** `Auto-Garage` · **Framework:** ASP.NET Core, .NET 10

---

## 1. Packages

From `Auto-Garage.csproj`:

| Package                                                               | Version        | Why                            |
| --------------------------------------------------------------------- | -------------- | ------------------------------ |
| `Microsoft.EntityFrameworkCore` (+ `.SqlServer`, `.Design`, `.Tools`) | 10.0.7         | ORM, migrations                |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore`                   | 10.0.7         | Users, roles, password hashing |
| `Microsoft.AspNetCore.Authentication.JwtBearer`                       | 10.0.7         | JWT validation                 |
| `System.IdentityModel.Tokens.Jwt` / `Microsoft.IdentityModel.Tokens`  | 8.17.0         | JWT creation and signing       |
| `Serilog.AspNetCore` (+ Console, File sinks)                          | 10.0.0         | Structured logging             |
| `Swashbuckle.AspNetCore`                                              | 10.1.7         | Swagger UI                     |
| `Microsoft.AspNetCore.OpenApi` / `Microsoft.OpenApi`                  | 10.0.7 / 2.7.5 | OpenAPI                        |

`Nullable` and `ImplicitUsings` are both enabled. **No AI SDK** — the assistant talks HTTP to an OpenAI-compatible endpoint, which is what lets one client class serve both a hosted model and a local one. → [05 §7](05-ai-assistant.md#7-two-providers-cloud-and-local)

---

## 2. Folder map

```
Auto-Garage/
├── Controllers/          10 controllers — the HTTP surface
├── Services/             business logic, one folder per area
├── Repositories/         data access, one folder per area
├── Models/
│   ├── DomainModels/     EF entities + enums
│   └── DtoModels/        request/response contracts
├── Data/
│   ├── AutoGarageDb/     business DbContext
│   └── AutoGarageAuthDb/ identity DbContext
├── Middlewares/          exception handling, token blacklist
├── BackgroundServices/   expired-token cleanup
├── Migrations/           EF migrations for both contexts
├── Logs/                 Serilog output (gitignored)
└── Program.cs            composition root
```

Each Service and Repository folder contains its interface and implementation together (`IBookingService.cs` + `BookingService.cs`), so a feature is one folder rather than parallel trees.

---

## 3. Program.cs — the composition root

Read this file first when picking the project up. In order, it:

1. Configures **Serilog** from `appsettings.json` and calls `UseSerilog()`
2. Registers controllers, endpoint explorer and **Swagger**
3. Registers **both DbContexts** against their connection strings
4. Registers **8 repositories** and **7 business services** as `Scoped`
5. Registers the **AI assistant** — options binding, a named `HttpClient` per model provider, the client factory, the tool executor and the service
6. Configures **Identity Core** with password rules and role support
7. Configures **JWT bearer** validation (issuer, audience, signing key)
8. Adds authorization and the **CORS** policy `AllowFrontend` (credentials enabled)
9. Adds the `TokenCleanupService` hosted service
10. Builds the pipeline in the order shown in [Architecture §4](02-architecture.md#4-authentication-and-authorization)

**Everything is `Scoped`** — one instance per request. This matters for `DbContext`, which is not thread-safe and must not be a singleton.

The AI registration is the only interesting one:

```csharp
static void ConfigureAssistantClient(
    IServiceProvider provider, HttpClient client, AssistantProvider which)
{
    var settings = provider
        .GetRequiredService<IOptions<AssistantOptions>>().Value.For(which);

    // Trailing slash matters: relative request URIs are resolved against it.
    client.BaseAddress = new Uri(settings.BaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
}

builder.Services.AddHttpClient(ChatCompletionClientFactory.CloudClient,
    (p, c) => ConfigureAssistantClient(p, c, AssistantProvider.Cloud));

builder.Services.AddHttpClient(ChatCompletionClientFactory.LocalClient,
    (p, c) => ConfigureAssistantClient(p, c, AssistantProvider.Local));

builder.Services.AddSingleton<IChatCompletionClientFactory, ChatCompletionClientFactory>();
```

Two points worth knowing:

**Named `HttpClient`s rather than `new HttpClient()`** — so `IHttpClientFactory` owns connection pooling and socket lifetime. Creating `HttpClient` per request exhausts sockets; a static one misses DNS changes. This is a small detail developers do ask about.

**Two registrations, one client class.** Groq and Ollama speak the same `/chat/completions` contract, so they differ only in base address and timeout. The factory picks between them per request, because the choice arrives with the request. → [05 §7](05-ai-assistant.md#7-two-providers-cloud-and-local)

---

## 4. Services

| Service               | Responsibility                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `BookingService`      | Customer bookings: create, update, cancel, read. Enforces "Pending only" edits and the price snapshot |
| `VehicleService`      | Customer garage: add, update, deactivate, reactivate. Unique plate per customer                       |
| `ServiceTypeService`  | The service catalogue                                                                                 |
| `InvoiceService`      | Invoice generation, retrieval, payment                                                                |
| `AdminBookingService` | Admin view of all bookings; confirm, assign, reassign, status changes                                 |
| `AdminUserService`    | Customer and staff listings, activation toggles                                                       |
| `JobWorkLogService`   | Mechanic work-log entries                                                                             |
| `AssistantService`    | The AI agent loop → [05](05-ai-assistant.md)                                                          |

**Signature convention:** customer-facing methods take `customerId` first and scope the query by it — see [Architecture §2](02-architecture.md#2-backend-layering). This is the single most important thing to understand about the codebase.

---

## 5. Repositories

`TokenRepository` · `VehicleRepository` · `BookingRepository` · `ServiceTypeRepository` · `InvoiceRepository` · `AdminBookingRepository` · `AdminUserRepository` · `JobWorkLogRepository`

Data access only — no business rules. `TokenRepository` is the odd one out: it also creates and validates JWTs, since token generation is a persistence-adjacent concern here.

---

## 6. API reference

Base URL: `https://localhost:7224`. All routes are `/api/...`.

### Auth — `/api/auth`

| Method | Path               | Access            | Purpose                                    |
| ------ | ------------------ | ----------------- | ------------------------------------------ |
| POST   | `/register`        | Anonymous         | Customer self-registration                 |
| POST   | `/register-staff`  | **Admin**         | Create an Admin or Mechanic                |
| POST   | `/login`           | Anonymous         | Returns access token + sets refresh cookie |
| GET    | `/currentUserData` | Any authenticated | Profile of the caller                      |
| POST   | `/logout`          | Any authenticated | Blacklists the token, clears the cookie    |
| POST   | `/refresh`         | Anonymous\*       | New access token from the refresh cookie   |
| PUT    | `/update-profile`  | Any authenticated | Update own profile                         |

\* Anonymous by attribute, but authenticated in practice by the HTTP-only cookie.

### Vehicles — `/api/vehicle`

Controller-level: `[Authorize(Roles = "Customer,Admin")]`

| Method | Path                           | Access         | Purpose                                |
| ------ | ------------------------------ | -------------- | -------------------------------------- |
| GET    | `/`                            | Customer/Admin | Active vehicles                        |
| GET    | `/inactive`                    | Customer/Admin | Removed vehicles                       |
| GET    | `/busy-ids`                    | **Customer**   | Ids of vehicles with an active booking |
| GET    | `/{id}`                        | Customer/Admin | One vehicle                            |
| POST   | `/`                            | Customer/Admin | Add                                    |
| PUT    | `/{id}`                        | Customer/Admin | Update                                 |
| PATCH  | `/{id}/reactivate`             | Customer/Admin | Restore a removed vehicle              |
| DELETE | `/{id}`                        | Customer/Admin | Soft delete                            |
| GET    | `/admin/customer/{customerId}` | **Admin**      | Any customer's vehicles                |

### Bookings — `/api/booking`

Controller-level: `[Authorize(Roles = "Customer")]`

| Method | Path    | Purpose                         |
| ------ | ------- | ------------------------------- |
| GET    | `/`     | The customer's bookings         |
| GET    | `/{id}` | One booking with status history |
| POST   | `/`     | Create                          |
| PUT    | `/{id}` | Update — **Pending only**       |
| DELETE | `/{id}` | Cancel — **Pending only**       |

### Service types — `/api/servicetype`

| Method | Path               | Access            | Purpose              |
| ------ | ------------------ | ----------------- | -------------------- |
| GET    | `/`                | Any authenticated | Active catalogue     |
| POST   | `/`                | **Admin**         | Create               |
| PUT    | `/{id}`            | **Admin**         | Update               |
| DELETE | `/{id}`            | **Admin**         | Deactivate           |
| GET    | `/inactive`        | **Admin**         | Deactivated services |
| PUT    | `/{id}/reactivate` | **Admin**         | Restore              |

### Invoices — `/api/invoice`

| Method | Path                         | Access       | Purpose                     |
| ------ | ---------------------------- | ------------ | --------------------------- |
| GET    | `/`                          | **Customer** | Own invoices                |
| GET    | `/{id}`                      | **Customer** | One invoice with line items |
| GET    | `/booking/{bookingId}`       | **Customer** | Invoice for a booking       |
| POST   | `/{id}/pay`                  | **Customer** | Mark paid                   |
| POST   | `/`                          | **Admin**    | Generate an invoice         |
| GET    | `/admin/all`                 | **Admin**    | All invoices                |
| GET    | `/admin/booking/{bookingId}` | **Admin**    | Invoice for any booking     |

### Admin — bookings — `/api/admin/bookings`

Controller-level: `[Authorize(Roles = "Admin")]`

| Method | Path             | Purpose                            |
| ------ | ---------------- | ---------------------------------- |
| GET    | `/`              | All bookings                       |
| GET    | `/{id}`          | One booking                        |
| GET    | `/mechanics`     | Mechanics available for assignment |
| PATCH  | `/{id}/confirm`  | `Pending → Confirmed`              |
| PATCH  | `/{id}/assign`   | Assign a mechanic                  |
| PATCH  | `/{id}/reassign` | Change mechanic                    |
| PATCH  | `/{id}/status`   | Advance status                     |

### Admin — users — `/api/admin`

Controller-level: `[Authorize(Roles = "Admin")]`

| Method | Path                            | Purpose        |
| ------ | ------------------------------- | -------------- |
| GET    | `/customers`                    | All customers  |
| GET    | `/customers/{id}`               | One customer   |
| PATCH  | `/customers/{id}/toggle-active` | Enable/disable |
| GET    | `/staff`                        | All staff      |
| PATCH  | `/staff/{id}/toggle-active`     | Enable/disable |

### Mechanic — `/api/mechanic/jobs`

Controller-level: `[Authorize(Roles = "Mechanic")]`

| Method | Path           | Purpose               |
| ------ | -------------- | --------------------- |
| GET    | `/`            | Assigned jobs         |
| GET    | `/{id}`        | Job detail            |
| PATCH  | `/{id}/status` | Advance repair status |

### Work logs

| Method | Path                                      | Access       | Purpose      |
| ------ | ----------------------------------------- | ------------ | ------------ |
| GET    | `/api/mechanic/jobs/{bookingId}/worklog`  | **Mechanic** | Read log     |
| POST   | `/api/mechanic/jobs/{bookingId}/worklog`  | **Mechanic** | Add entry    |
| DELETE | `/api/mechanic/jobs/worklog/{itemId}`     | **Mechanic** | Remove entry |
| GET    | `/api/admin/bookings/{bookingId}/worklog` | **Admin**    | Read any log |

### AI assistant — `/api/assistant`

Controller-level: `[Authorize(Roles = "Customer")]`

| Method | Path         | Purpose                                                       |
| ------ | ------------ | ------------------------------------------------------------- |
| POST   | `/chat`      | Send a message — **can read, never writes**                   |
| POST   | `/confirm`   | Execute a confirmed action — **the only write path**          |
| GET    | `/providers` | Which model backends are reachable, for the chat-window toggle |

→ [05](05-ai-assistant.md)

---

## 7. Notable implementation details

**Route constraints.** `{id:guid}` rejects malformed ids at routing time, so a bad id is a 404 rather than a parse exception in the service.

**Invoice roles in one controller.** `InvoiceController` has no controller-level `[Authorize]` — each action declares its own role, because customer and admin endpoints share the file. Worth noticing: forgetting an attribute here leaves an endpoint open. A cleaner design would split the controllers.

**Status transitions are validated in services**, not just the UI. The UI hides invalid buttons; the service rejects the transition regardless.

**The price snapshot bug.** `BookingService.UpdateAsync` once assigned `ServiceTypeId` before comparing it, so the comparison was always false and the snapshot silently kept the old price. Fixed by comparing first:

```csharp
// Compare before assigning — otherwise the check below always sees equal values
// and the price snapshot silently keeps the old service's price.
if (booking.ServiceTypeId != dto.ServiceTypeId)
    booking.BookedBasePrice = serviceType.BasePrice;
```

The UI never exercised that path; the AI assistant's `reschedule_booking` did, on day one. → [05 §8.4](05-ai-assistant.md#84-a-pre-existing-bug-the-ai-exposed)

---

## 8. Known rough edges

Being able to name these is a strength, not a weakness.

- `Jobworklogcontroller.cs` breaks the PascalCase naming of every other controller, and holds an unused `catch (Exception ex)` variable.
- `ITokenRepositiry` — a typo in a public interface name, now awkward to change.
- Some services return domain models where a DTO would be cleaner.
- Nullable warnings remain in `Program.cs` (the JWT key) and `ServiceTypeService`.
- No automated tests. The layering makes services testable — the seams exist, the tests do not.

---

_Next: [Frontend Guide](04-frontend.md) · [AI Assistant](05-ai-assistant.md)_

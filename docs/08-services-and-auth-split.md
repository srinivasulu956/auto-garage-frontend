# Services: splitting Auth out

The backend started as one ASP.NET Core project. It is now three, plus a shared data library. This document is about why, what actually blocked it, and what the split cost.

---

## 1. The two things that prompted it

**A background job that did not belong in a web server.** A hosted service inside the API cleaned up expired tokens once an hour. That is fine with one API instance and wrong with two: each instance ran its own copy of the loop, and two copies deleting the same rows raced each other. Scaling the web tier was silently scaling a janitor.

**Auth was already almost separate.** Login, registration, refresh and the user directory shared nothing with bookings except a database connection. The one thing that genuinely tied them together turned out to be removable — see §4.

---

## 2. The shape now

```
Auto-Garage-Solution.slnx
├── Auto-Garage.Auth.Data/     class library — DbContext, user + token entities, auth migrations
├── Auto-Garage.Auth.Api/      the auth service — owns AutoGarageAuth
├── Auto-Garage.Auth.Worker/   token cleanup — no ports, no HTTP
└── Auto-Garage/               the garage API — owns AutoGarage
```

| | Owns | Talks to | Published port |
| --- | --- | --- | --- |
| **Auth.Api** | `AutoGarageAuth` | — | 5001 |
| **Auth.Worker** | — (reads Auth's DB) | — | none |
| **Garage API** | `AutoGarage` | Auth.Api over HTTP | 5000 |

**Auth.Data is shared by Auth.Api and Auth.Worker, and by nothing else.** Two processes over one database inside a single service boundary is normal. The garage API sharing that database is what would be the anti-pattern, and it no longer can — it has no connection string for it.

---

## 3. What did *not* change: token validation

The obvious fear about splitting auth is that every request now needs a network call to check the caller. It does not.

A JWT is signed. Verifying it is a signature check against a key both services hold — local arithmetic, no lookup. The Auth service mints tokens; the garage API verifies them and reads the claims inside. Neither calls the other to do it.

This is the single reason the split is cheap, and it is worth saying out loud in an interview, because it is the first thing an interviewer will probe.

---

## 4. What *did* block it: the token denylist

Logout used to write the access token to a `BlacklistedTokens` table, and middleware checked that table **on every authenticated request**. One database round trip per call, against a database the garage API was supposed to stop owning.

Three options:

| | Cost |
| --- | --- |
| Call Auth over HTTP per request | A network hop on every single request. Unacceptable. |
| Move the denylist to Redis | Keeps instant revocation, adds infrastructure. |
| **Drop it; revoke the refresh token instead** | An access token stays valid up to 15 minutes after logout. |

The third was chosen. Logout revokes the refresh token, so the client cannot mint another access token; the one it holds expires on its own within 15 minutes. That is what most stateless-JWT systems do.

The trade is real and should be stated as a trade: **instant revocation was exchanged for removing a database query from every request**. If this were a banking app the answer would be Redis.

The table is dropped by the `DropBlacklistedTokens` migration.

---

## 5. Cross-service data: two different answers

The garage API used to query the auth database in three places. Each got a different treatment, and the difference is the interesting part.

### 5.1 Names on a booking → snapshot

`AdminBookingService` joined customer and mechanic names onto every booking DTO. `MapListAsync` looped over bookings and each `MapAsync` ran **three** queries — customer name, customer email, mechanic name. Thirty bookings meant ninety queries. Over HTTP that would have become ninety network calls.

The fix was not a faster client. It was to stop asking:

```csharp
public string CustomerName { get; set; }          // captured at booking creation
public string CustomerEmail { get; set; }
public string? AssignedMechanicName { get; set; } // captured at assignment
```

These are not a cache. They are part of the record, for the same reason `BookedBasePrice` already was — a booking is a historical document. A job sheet from last year should still say who did the work, even if that mechanic has since changed their name or left.

Mapping is now **synchronous** and touches no other service. That is the tell that it worked.

> Existing rows get blank snapshots, because the service that writes them can no longer read the auth database. `Migrations/AutoGarageDb/BackfillBookingPersonSnapshots.sql` is a one-off admin job that fills them in while both databases still sit on one server.

### 5.2 Live user state → HTTP through a gateway

Admin screens genuinely need current data: who is on staff now, who is active, which mechanics exist. Those go over HTTP behind `IAuthGateway`, with a 30-second memory cache so one screen's worth of requests costs one call.

`IAdminUserRepository` was deleted rather than reimplemented. It was an abstraction over EF queries; with auth behind HTTP, the gateway *is* that abstraction, and a repository on top would be a layer wrapping a layer.

### 5.3 Role checks → HTTP, always

Assigning a mechanic validates the id belongs to a real, active user holding the Mechanic role. That must be asked of Auth every time — it owns roles, and a stale answer here is a security answer. Verified: assigning a customer's id returns _"The specified user is not a mechanic."_

---

## 6. Service-to-service authentication

The internal endpoints (`/api/internal/users/*`) are guarded by a shared key in an `X-Internal-Key` header, not by a user's JWT.

A user token would be the wrong credential twice over: these calls are made by the garage API on its own behalf, sometimes with no user involved — and accepting one would let any signed-in customer call them by hand.

Details worth defending:

- **Fails closed.** An unset key returns 503 rather than waving requests through. "Not configured" must never mean "no check needed".
- **Constant-time comparison.** `CryptographicOperations.FixedTimeEquals`, because an ordinary string compare returns sooner for a key sharing a longer prefix, leaking the secret one character at a time.
- **Not published.** In compose, the internal endpoints are reachable only within the network.

Verified: no key → 401, wrong key → 401, correct key → 200, and **a valid customer JWT → 401**.

mTLS or a client-credentials flow is what this becomes in production. The seam is identical.

---

## 7. The worker, and the bugs found while moving it

Moving the cleanup loop was the moment to fix what was wrong with it.

**It never ran.** `lastRefreshTokenCleanup` was initialised to `DateTime.UtcNow`, so the refresh-token sweep first fired 24 hours after startup. Anything restarting the process daily — a deploy, a container restart — meant refresh tokens were **never cleaned at all**. It now sweeps once on startup.

**A clean shutdown looked like a crash.** `Task.Delay` sat outside the try/catch, so cancellation escaped `ExecuteAsync` — and .NET's default `BackgroundServiceExceptionBehavior` is `StopHost`. `PeriodicTimer` returns `false` on cancellation instead of throwing, so stopping is now just stopping.

**Deletes were done the expensive way.** The old code loaded every expired row into memory, tracked it, and deleted row by row — which also meant an optimistic-concurrency check, so two instances doing this at once threw `DbUpdateConcurrencyException`. `ExecuteDeleteAsync` is one SQL statement, no tracking, no concurrency check.

The worker also **does not call `Database.Migrate()`**. Auth.Api owns the schema. Two processes racing migrations on startup is a classic way to corrupt one.

On first run it swept 74 stale tokens immediately — rows the old code would have left sitting.

---

## 8. The frontend changed by one file

The React app still calls `/api/Auth/login` and `/api/bookings` exactly as before. Only the Vite proxy changed:

```js
'/api/Auth': { target: 'https://localhost:7300' },  // Auth service — must come first
'/api':      { target: 'https://localhost:7224' },  // Garage API
```

**Order matters.** Vite tests prefixes in order and the first match wins; swap them and every login goes to the garage API and 404s.

In production the same job belongs to a reverse proxy or an API gateway. Worth mentioning — it shows you know the dev proxy is standing in for real infrastructure.

---

## 9. Running it

Three processes, three terminals:

```bash
dotnet run --project Auto-Garage.Auth.Api --urls https://localhost:7300
```

```bash
dotnet run --project Auto-Garage --urls https://localhost:7224
```

```bash
dotnet run --project Auto-Garage.Auth.Worker
```

Migrations now need their own project and startup project:

```bash
dotnet ef database update --project Auto-Garage.Auth.Data --startup-project Auto-Garage.Auth.Api
```

```bash
dotnet ef database update --project Auto-Garage --startup-project Auto-Garage --context AutoGarageDbContext
```

Or `docker compose up` for all four containers.

**`Auth:InternalKey` in the garage API must equal `InternalApi:Key` in the auth service.** A mismatch shows up as empty admin screens, and the gateway logs that exact hint when it sees a 401.

---

## 10. Honest assessment

**What this genuinely buys:** the cleanup loop runs once regardless of API instances; auth can be scaled, deployed and secured on its own; the garage API cannot read user data it has no business reading, because the connection no longer exists.

**What it costs:** three processes to run instead of one, two migration histories, a shared key to keep in sync, and a new failure mode — the auth service being down now breaks admin screens, where before it was one process failing together.

**What is still missing:** no retry or circuit breaker on the gateway (Polly is the obvious answer), no health checks, no tracing across the boundary. For a system this size that is a reasonable stopping point, but say so before an interviewer asks.

**Would a monolith have been fine?** For this traffic, yes. The defensible reason to split is the one at the top: a background loop and a web tier have different lifecycles, and pretending otherwise breaks the moment you scale.

---

_See also: [Architecture](02-architecture.md) · [Backend](03-backend.md) · [Setup & Run](06-setup-and-run.md)_

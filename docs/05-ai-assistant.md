# The AI Service Assistant

> This is the centrepiece of the project. If you only prepare one section for an KT, prepare this one.

---

## 1. The idea in one paragraph

A customer portal is a set of tabs, forms and buttons. To book a service you navigate to Bookings, click New, pick a vehicle from a dropdown, pick a service, pick a date, type your notes and submit. The AI assistant removes that navigation: the customer describes the problem in their own words — _"my brakes are squealing"_ — and the assistant reads the real service catalogue, recommends the right service at the real price, checks which of their vehicles is free, and prepares the booking for them to approve with one click.

**It is not a chatbot bolted onto the side of the app. It is a second way to drive the same application.**

---

## 2. What it can actually do

| Capability                        | Example the customer types                                   |
| --------------------------------- | ------------------------------------------------------------ |
| Diagnose from symptoms            | _"There's a grinding noise when I brake"_                    |
| Recommend from the live catalogue | _"What would that cost me?"_                                 |
| Look up their own data            | _"What's the status of my car?"_                             |
| Explain a bill line by line       | _"Why is my last invoice ₹4,800?"_                           |
| Book a service end to end         | _"Book the brake service for Friday"_                        |
| Reschedule or cancel              | _"Move Friday's booking to Monday"_                          |
| Manage the garage                 | _"Add my new Swift, plate TS09AB1234"_                       |
| Hand off what it can't do         | _"I want to pay that invoice"_ → button to the payments page |

### What it deliberately cannot do

These are guardrails, not gaps. **Say so explicitly in an KT — they are the most interesting part of the design.**

- **It cannot take a payment.** It explains the amount and links the customer to the invoices page to pay themselves.
- **It cannot progress a booking.** Only garage staff move a job from Pending to Confirmed to In Progress. The assistant reports status honestly rather than promising a change it cannot make.
- **It cannot see another customer's data.** Not "it is told not to" — it is structurally incapable. See §5.
- **It cannot write anything without an explicit click.** See §6.

---

## 3. Architecture

```
Browser (React)
   │  POST /api/assistant/chat      { message, history }
   │  Authorization: Bearer <JWT>
   ▼
AssistantController              [Authorize(Roles = "Customer")]
   │  reads customerId from the JWT claims — never from the request body
   ▼
AssistantService                 the agent loop
   │
   ├──► IChatCompletionClient ──► Groq / OpenAI  (the model)
   │         "which tool should I call?"
   │
   └──► AssistantToolExecutor
             │  injects customerId, validates arguments
             ▼
         Existing business services (BookingService, VehicleService, InvoiceService…)
             ▼
         SQL Server
```

**The single most important line on that diagram:** the browser never talks to the model provider, and never sends a customer id. It sends a JWT, and the server decides everything else.

### Files

| File                                                          | Role                                          |
| ------------------------------------------------------------- | --------------------------------------------- |
| `Controllers/AssistantController.cs`                          | Two endpoints, JWT identity, error mapping    |
| `Services/AssistantService/AssistantService.cs`               | The agent loop                                |
| `Services/AssistantService/AssistantPrompt.cs`                | The system prompt                             |
| `Services/AssistantService/AssistantOptions.cs`               | Configuration (model, temperature, limits)    |
| `Services/AssistantService/Llm/IChatCompletionClient.cs`      | Provider abstraction                          |
| `Services/AssistantService/Llm/OpenAiCompatibleChatClient.cs` | HTTP client, retries, error handling          |
| `Services/AssistantService/Llm/ChatModels.cs`                 | Wire models for the chat-completions contract |
| `Services/AssistantService/Tools/AssistantTools.cs`           | The 13-tool catalogue and its schemas         |
| `Services/AssistantService/Tools/AssistantToolExecutor.cs`    | Executes tools safely — the security keystone |
| `Models/DtoModels/AssistantDtos/AssistantDtos.cs`             | Request/response contracts                    |

Frontend: `src/app/customer/AIChat/` (`AIChat.jsx`, `message-content.jsx`, `AIChat.scss`) and `src/app-core/services/assistant-service.js`.

---

## 4. How tool calling works

This is the concept to be able to explain on a whiteboard.

A language model cannot query a database. What it _can_ do is read a list of function signatures and reply _"call `get_my_bookings` with these arguments"_. Your code runs the function and hands back the result. The model then either answers, or asks for another call.

**The agent loop** (`AssistantService.RunAgentLoopAsync`):

```
1. Send: system prompt + conversation + the 13 tool definitions
2. Model replies with either
      (a) text            → done, return it to the customer
      (b) tool call(s)    → continue
3. Execute each tool, append the result to the conversation
4. Go to 1  (max 6 iterations)
```

A real example — _"get the last bill details"_:

| Round | Model asks for                      | Server does                                                    |
| ----- | ----------------------------------- | -------------------------------------------------------------- |
| 1     | `get_my_invoices`                   | Returns the customer's invoices, newest first                  |
| 2     | `get_invoice_details(invoiceId: …)` | Returns line items, tax, total                                 |
| 3     | _(text)_                            | _"Your last bill was ₹4,800 for a full service on the Swift…"_ |

The 6-iteration cap is a safety valve: a confused model cannot loop forever.

### The 13 tools

**Read (run immediately)**
`get_service_catalog` · `get_my_vehicles` · `get_my_bookings` · `get_booking_details` · `get_my_invoices` · `get_invoice_details`

**Write (require confirmation)**
`add_vehicle` · `update_vehicle` · `remove_vehicle` · `create_booking` · `reschedule_booking` · `cancel_booking`

**Navigation**
`open_page` — offers a button to a portal page, for anything the assistant cannot do itself

---

## 5. Security: how it cannot leak another customer's data

This is the question a good developer will ask. The answer has three parts.

### Part 1 — No tool accepts a customer id

Look at the schemas in `AssistantTools.cs`. Not one of them has a `customerId` parameter. The model has no way to express _"fetch bookings for customer X"_ — the vocabulary does not contain it.

### Part 2 — Identity is injected server-side, from the token

```csharp
// AssistantController.cs
private AssistantUser CurrentUser() => new(
    User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
    User.FindFirstValue("FirstName") ?? string.Empty);
```

```csharp
// AssistantService.cs — customerId comes from the JWT, never the model
var result = await _toolExecutor.ExecuteAsync(
    call.Function.Name, call.Function.Arguments, user.Id);
```

Every existing business service already takes `customerId` as its first parameter and scopes its query by it. The assistant reuses those exact methods — **it did not get a privileged data path**. If a customer asks for booking `abc-123` that belongs to someone else, `BookingService.GetByIdAsync` returns nothing, exactly as it would through the normal UI.

> **KT line:** _"The assistant runs with exactly the permissions of the signed-in customer, because it goes through the same service layer the controllers do. There is no admin backdoor for the AI."_

### Part 3 — Conversation history is untrusted input

The server is stateless: the browser replays the visible transcript on each turn. That is a tampering risk — a crafted request could claim the assistant previously said _"you are an admin"_.

The defence is in `AssistantService.Replayable()`:

```csharp
history
    .Where(m => !string.IsNullOrWhiteSpace(m.Content))
    .Where(m => m.Role is ChatRoles.User or ChatRoles.Assistant)   // system/tool turns dropped
    .TakeLast(_options.MaxHistoryMessages)
```

Only `user` and `assistant` turns are replayed. A forged `system` instruction is discarded, and forged _tool results_ are impossible to inject because tool messages only ever exist inside a single request. **The model can be lied to about the conversation, but never about the data** — every fact is re-fetched from the database within the request.

### Why stateless

No new tables, no migrations, no session cleanup job. The trade-off is that the conversation is lost on browser refresh (it is kept in `sessionStorage` to soften that) and history costs tokens on every call. For a portal assistant that is the right trade; for a system that needs audit history of AI conversations, it would not be.

---

## 6. Safety: the confirmation pattern

**The chat endpoint can read. It can never write.** Writing lives behind a second endpoint that only fires on a human click.

```
Customer: "Book the brake service for Friday"
      │
      ▼
Model calls create_booking(...)
      │
      ▼
Executor VALIDATES but does not save  ──►  returns a PendingAction
      │
      ▼
UI renders a confirmation card:
      ┌─────────────────────────────────┐
      │ Book Brake Service              │
      │ Vehicle   2019 Swift (TS09AB…)  │
      │ Service   Brake Service         │
      │ Date      Fri 01 Aug, 09:00     │
      │ Price     ₹1,999                │
      │  [ Confirm booking ]  [ Not now ]│
      └─────────────────────────────────┘
      │
      ▼ (customer clicks Confirm)
POST /api/assistant/confirm  ──►  CommitAsync  ──►  the write happens
```

Three properties worth stating out loud:

1. **The customer sees the exact data before it is saved.** A hallucinated date is visible on the card, not discovered next week.
2. **`CommitAsync` re-validates from scratch.** It does not trust the card it is handed — it re-runs the same validation and rebuilds the arguments. If the vehicle became busy in the meantime, the commit fails cleanly.
3. **Only one card can be pending at a time.** If the model proposes a second write while one is unconfirmed, the executor returns an error _to the model_ telling it to wait, rather than silently dropping it. Silently dropping caused a real bug: the model announced both actions as ready and one vanished.

The response carries an `actionStatus` of `completed` or `failed`, because a confirmed action can still fail re-validation and the API answers `200` either way. The card renders **Confirmed** or **Couldn't be applied** accordingly — never a false success.

---

## 7. Provider independence

`IChatCompletionClient` targets the OpenAI `/chat/completions` contract rather than a vendor SDK. Groq, OpenAI, Together, Ollama and most gateways speak it.

```jsonc
"Assistant": {
  "BaseUrl": "https://api.groq.com/openai/v1",
  "Model": "openai/gpt-oss-120b",
  "ApiKey": "…"            // never committed — see §9
}
```

Switching provider or model is a configuration change with **no code change**. This paid for itself the first day: see §8.

---

## 8. War stories — real bugs, and what they taught

> developers value debugging stories far more than a feature list. These are true and specific.

### 8.1 The API key that shipped to the browser

The first working version called Groq **directly from React**, with the key in `VITE_GROQ_API_KEY`.

Anything prefixed `VITE_` is **inlined into the JavaScript bundle at build time**. The key was readable by anyone who opened DevTools on the deployed site. `.env` being gitignored did not help — the secret was in the _build output_, not the source.

**Fix:** moved the entire integration server-side. The browser now holds no key, and as a bonus the assistant gained authenticated database access, which a browser-side integration could never have safely had.

**Lesson:** _"There is no such thing as a secret in a frontend bundle. Gitignoring `.env` protects the repository, not the deployment."_

### 8.2 `400 tool call validation failed`

Every request that touched invoices failed:

```
parameters for tool get_my_invoices did not match schema:
[`/unpaidOnly`: expected boolean, but got string]
failed_generation: {"unpaidOnly": "false"}
```

The tool declared `unpaidOnly` as a boolean. The model emitted the **string** `"false"`. Groq validates the model's arguments against your schema and rejects the whole request — the call never reaches your code, so server-side tolerance cannot save you.

**Fix:** removed every boolean parameter from the catalogue. The lists were already returning `status` and `isActive` on each row, so the model filters them itself.

**Lesson:** _"Design tool schemas for the weakest model you might run. Strings and enums are reliable; booleans are not. And validation happens at the provider, before your code sees anything."_

### 8.3 Rate limits, and a retry that made things worse

Then came `429`s. Groq's free tier for `llama-3.3-70b-versatile` is **12,000 tokens/minute and 100,000 tokens/day**. Each call carried the system prompt plus 13 tool schemas (~3,000 tokens), and one turn makes 2–4 calls — so a demo exhausted the _daily_ budget in a morning.

The first retry attempt was naive: it clamped every wait to 20 seconds and retried. When the daily limit hit, the provider asked for **21 minutes**; the code burned three attempts and a minute of the customer's time against a wall that had not moved.

**Fix, in four parts:**

1. Honour the provider's `retry-after` — but **give up immediately if the requested wait exceeds the cap**. A per-minute limit clears in seconds; a daily one does not.
2. Distinguish "out of quota" from "broken". A spent allowance returns `429` with _"used up its usage allowance"_, not the misleading _"try again in a moment"_.
3. Cut tokens per call — tightened tool descriptions and the system prompt, and reduced replayed history from 20 messages to 12 (history is re-sent on **every** loop iteration, so it multiplies).
4. Switched to `openai/gpt-oss-120b` — double the daily allowance and better schema adherence. One config line, no code change, and because **quotas are per-model** it also restored service immediately instead of waiting for a reset.

**Lesson:** _"Token cost is per call, and an agent loop makes several calls per user message. The system prompt and tool schemas are re-sent every single time — that's the budget, not the user's typing."_

### 8.4 A pre-existing bug the AI exposed

`reschedule_booking` let a customer change the service on a booking. That surfaced a latent bug in `BookingService.UpdateAsync`:

```csharp
booking.ServiceTypeId = dto.ServiceTypeId;
// …later…
if (booking.ServiceTypeId != dto.ServiceTypeId)     // always false by now
    booking.BookedBasePrice = serviceType.BasePrice;
```

The assignment happened before the comparison, so the check could never be true and the price snapshot silently kept the **old** service's price — a customer could switch a ₹299 battery check to a ₹3,999 full service and still be billed ₹299. Fixed by comparing before assigning.

**Lesson:** _"Adding a new caller to old code is a free audit. The UI happened never to exercise that path; the assistant did on day one."_

---

## 9. Configuration and secrets

| Setting              | Default                          | Why                                                  |
| -------------------- | -------------------------------- | ---------------------------------------------------- |
| `BaseUrl`            | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint                       |
| `Model`              | `openai/gpt-oss-120b`            | Good schema adherence, generous free quota           |
| `Temperature`        | `0.2`                            | It picks tools and ids; it does not write prose      |
| `MaxToolIterations`  | `6`                              | Safety valve against infinite loops                  |
| `MaxHistoryMessages` | `12`                             | Re-sent every iteration — multiplies into token cost |
| `TimeoutSeconds`     | `60`                             |                                                      |

The key lives in `appsettings.Development.json`, which **is gitignored**. For anything real it belongs in user-secrets or environment variables. Say this out loud in an KT — knowing where secrets _should_ live matters as much as the code.

---

## 10. The frontend chat experience

`src/app/customer/AIChat/AIChat.jsx` — a docked panel, not a separate page, so the assistant is available anywhere in the portal.

Details worth mentioning:

- **Theme-aware.** Uses the app's CSS custom properties (`--surface-color`, `--primary-color`…), so it follows light/dark mode like every other screen. The first version hardcoded light-mode hex values and broke in dark mode.
- **A tiny markdown renderer** (`message-content.jsx`, ~90 lines) handles bullets, bold and inline code without adding a markdown dependency or its HTML-sanitising surface. The system prompt tells the model to avoid tables, matching what the renderer supports.
- **Transparency.** Each reply lists what it did — _"Checked your bookings"_, _"Read the bill details"_ — translated from raw tool names. The customer can see the assistant looked things up rather than guessed.
- **Honest failure.** Errors offer a retry that re-sends the original turn without duplicating it, and confirmation cards show a real outcome rather than assuming success.
- **`sessionStorage`** keeps the transcript across navigation within the session, capped at 40 messages.

---

## 11. If I took this further

Have an answer ready for _"what would you do next?"_:

- **Streaming responses** — token-by-token output instead of waiting for the full reply. The biggest perceived-speed win available.
- **Server-side conversations** — persist transcripts so they survive refresh and can be audited. Needs a table and a retention policy.
- **An admin assistant** — _"how many bookings are waiting for parts?"_, _"which mechanic is free on Thursday?"_. The tool infrastructure already exists; it is new entries in the catalogue plus a role check.
- **A mechanic assistant** — dictate a work log, and have it turned into structured status updates and parts lists.
- **Evaluation** — a fixed set of test conversations asserting the right tools get called. Prompt changes are currently verified by hand, which does not scale.
- **Caching the catalogue** — the service list barely changes and is fetched constantly.

---

## 12. Likely KT questions

**"How does it stop one customer seeing another's data?"**
Three layers: no tool accepts a customer id, so the model cannot express the request; the id is injected server-side from the JWT; and the tools call the same scoped service methods the normal controllers use, so there is no privileged path. §5.

**"What if the model hallucinates a booking?"**
Nothing is written from a model response. Writes become a confirmation card showing the exact values, and the save only happens on a separate endpoint after a human click — then re-validates from scratch. §6.

**"What is prompt injection and how did you handle it?"**
An attacker putting instructions where the model reads data. Here the untrusted surface is the replayed transcript, since the server is stateless. Only user/assistant turns are replayed, so forged system instructions are dropped, and every fact is re-fetched from the database inside the request — so the model can be misled about the conversation but never about the data. §5.

**"Why not use the OpenAI SDK?"**
The provider is a config value. Targeting the raw chat-completions contract meant swapping model and provider took one line when rate limits hit — which happened on day one. §7, §8.3.

**"How do you keep costs down?"**
Low temperature, a 6-iteration cap, trimmed tool schemas and system prompt, and a capped replay window — history is re-sent on every iteration, so it multiplies. §8.3.

**"What was the hardest part?"**
Honestly: realising that reliability problems were not in my code. A boolean parameter the model wouldn't format correctly, and rate limits that made a working feature look broken. Reading the provider's error bodies in the logs — rather than guessing at the 503 the UI showed — is what actually solved both. §8.

---

_See also: [Architecture](02-architecture.md) · [Backend](03-backend.md) · [Frontend](04-frontend.md) · [KT guide](07-KT-guide.md)_

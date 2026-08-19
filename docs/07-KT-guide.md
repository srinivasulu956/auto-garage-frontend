# KT Guide

How to talk about this project. The other documents describe the system; this one prepares you to defend it.

---

## 1. The 30-second pitch

> _"AutoFix is a garage management system with three roles — customers, admins and mechanics — sharing one workflow: a booking moves through a ten-stage lifecycle from booked to paid, and each role can only advance the stages it owns._
>
> _The part I'd want to talk about is the AI assistant. Customers can run the entire portal by conversation — describe a symptom, get a recommendation from the live service catalogue at the real price, and book it with one click, without touching a form. It uses tool calling, so the model doesn't query a database; it asks my server to run specific functions, and my server decides what it's allowed to run."_

Then stop. Let them pick the thread.

**If they ask one follow-up, it will almost certainly be _"how do you stop it seeing other customers' data?"_** That answer is in [05 §5](05-ai-assistant.md#5-security-how-it-cannot-leak-another-customers-data) and you should know it cold.

---

## 2. The five answers to have ready

### "Walk me through the architecture."

Three layers on the backend — controllers do HTTP, services do business rules, repositories do data access. React SPA on the front, JWT between them.

The one convention worth mentioning: **every customer-facing service method takes `customerId` as its first parameter and scopes the query by it.** Ownership isn't checked separately, it's part of the query. That decision is what later made the AI safe to build — the assistant calls those same methods, so it inherited the permission model instead of needing a new one.

### "How does the AI assistant actually work?"

A model can't query a database. What it can do is read function signatures and reply _"call `get_my_bookings`"_. So there's a loop: send the conversation plus 13 tool definitions; if the model asks for a tool, run it, append the result, send again; if it answers in text, we're done. Capped at 6 rounds.

Give the concrete trace — _"get my last bill"_ becomes `get_my_invoices` → `get_invoice_details` → a plain-English summary. [05 §4](05-ai-assistant.md#4-how-tool-calling-works)

### "What if the model hallucinates?"

Two different problems, two different answers.

_Hallucinated facts_ can't survive, because every fact comes from a tool call against the real database — the model never answers from memory about prices or bookings.

_Hallucinated actions_ are handled by the confirmation pattern: **the chat endpoint can read but can never write.** A write becomes a card showing the exact values, and the save happens on a separate endpoint only after a human clicks Confirm — which re-validates from scratch rather than trusting the card. [05 §6](05-ai-assistant.md#6-safety-the-confirmation-pattern)

### "What was the hardest bug?"

Use the rate-limit story ([05 §8.3](05-ai-assistant.md#83-rate-limits-and-a-retry-that-made-things-worse)). It's the strongest because your first fix was wrong:

_"Users reported it dying mid-conversation. The UI showed a generic 503, so I read the provider's response bodies in the logs and found two unrelated causes wearing the same mask — a schema validation failure and a rate limit._

_I added retries. That made it worse: when the daily quota went, the provider asked for 21 minutes, my code clamped it to 20 seconds and burned three attempts against a wall that hadn't moved. The real fix was to give up immediately when the requested wait exceeds what a waiting user will tolerate, tell them 'out of quota' instead of 'try again in a moment', and cut the tokens per call — because in an agent loop the system prompt and tool schemas are re-sent on every single iteration."_

That answer shows debugging from evidence, admitting a wrong fix, and understanding the cost model.

### "What would you do differently?"

Lead with tests — see §5. Then: streaming responses for perceived speed, and server-side conversation persistence if this needed auditing.

---

## 3. Questions by topic

**Auth**

- _Why JWT and not sessions?_ Stateless, scales horizontally, works cleanly for an SPA on a different origin.
- _JWTs can't be revoked — so how does logout work?_ Two mechanisms: a 15-minute lifetime bounds exposure, and a blacklist table rejects logged-out tokens, cleaned by a background service.
- _Why is the refresh token in a cookie and not localStorage?_ HTTP-only means JavaScript can't read it, so XSS can't steal it. The access token is short-lived enough to accept the risk.
- _What's in your JWT?_ User id, name, email, first/last name, and roles. The user id is the scoping key for every query.

**Backend**

- _Why two databases?_ Identity's schema is large and opinionated; isolating it keeps the business schema and its migrations clean. Cost: no FK across the boundary, so integrity there is the application's job.
- _Why repositories over `DbContext` directly?_ A seam for testing and to keep services persistence-agnostic. Honest caveat: some are thin enough to be near-pass-throughs.
- _Why `AddHttpClient` instead of `new HttpClient()`?_ Socket exhaustion from per-request instances, stale DNS from a static one. The factory handles both.
- _Why snapshot the price on the booking?_ Otherwise a price change rewrites history, and old invoices stop matching what the customer was quoted.

**Frontend**

- _Why so little in Redux?_ Only auth and theme are genuinely global. Server data is fetched per screen — simpler than a cache and always correct. If it grew, RTK Query, not more slices.
- _How is role-based routing enforced?_ `ProtectedRoute` handles UX; the server's `[Authorize(Roles = …)]` is the actual enforcement. **Say this explicitly — client-side guards are not security.**
- _What happens when a token expires mid-page?_ `api-client` catches the 401, refreshes once, retries. Concurrent 401s share one refresh promise so four requests don't trigger four rotations.
- _How does theming work?_ CSS custom properties on `:root`; dark mode swaps values, not stylesheets. Components never hardcode hex.

**AI — the deep end**

- _What is tool calling?_ [05 §4](05-ai-assistant.md#4-how-tool-calling-works)
- _What is prompt injection, and where is your exposure?_ Untrusted text reaching the model as instructions. Here it's the replayed transcript, since the server is stateless. Only user/assistant turns are replayed, so a forged `system` turn is dropped — and every fact is re-fetched from the database inside the request, so the model can be lied to about the conversation but never about the data.
- _Why not LangChain / Semantic Kernel?_ The loop is about 60 lines and I can explain every one. A framework would have added abstraction over something I needed to understand exactly. For a bigger tool surface I'd reconsider.
- _How do you control cost?_ Temperature 0.2, a 6-iteration cap, trimmed schemas and prompt, and a capped history window — history is re-sent every iteration, so it multiplies.
- _What happens if the AI provider is down?_ `ChatCompletionException` → 503 with a plain message, and the rest of the portal is unaffected. Quota exhaustion is reported as 429 with different wording, because "try again in a moment" is a lie when the answer is tomorrow.

---

## 4. Talking points that land

**"The API key was in the frontend bundle."**
Anything `VITE_`-prefixed is inlined into the JavaScript at build time. Gitignoring `.env` protects the repository, not the deployment. Moving the integration server-side fixed the leak _and_ gave the assistant authenticated database access it could never have had safely in a browser. [05 §8.1](05-ai-assistant.md#81-the-api-key-that-shipped-to-the-browser)

**"The AI found a bug the UI never triggered."**
A price-snapshot check compared a value it had already overwritten, so a customer could switch a ₹299 service to a ₹3,999 one and still be billed ₹299. The UI happened never to exercise that path; the assistant did on day one. **Adding a new caller to old code is a free audit.** [05 §8.4](05-ai-assistant.md#84-a-pre-existing-bug-the-ai-exposed)

**"Design tool schemas for the weakest model you might run."**
A boolean parameter broke every invoice request — the model emitted `"false"` as a string and the provider rejected the call before my code saw it. Removing booleans entirely was more robust than tolerating them, because validation happens at the provider. [05 §8.2](05-ai-assistant.md#82-400-tool-call-validation-failed)

**"Programming to a contract paid twice."**
The assistant targets the OpenAI `/chat/completions` shape rather than a vendor SDK. The first payoff was swapping model and provider in one config line when rate limits hit. The second was bigger: adding a second backend — a model running locally through Ollama — needed **no new client code at all**, because Ollama speaks the same contract. Cloud and Local are the same class over a different named `HttpClient`. [05 §7](05-ai-assistant.md#7-two-providers-cloud-and-local)

**"Graceful degradation beats an error page."**
When the cloud quota is spent the assistant doesn't fail — it answers on the local model, moves the toggle to match, and tells the user the reply came from a weaker model. Three details make it correct: only a usage-limit error triggers it (a bad key would fail twice), the conversation is rebuilt from scratch because the agent loop mutates it as it runs, and the fallback is never silent. [05 §7.4](05-ai-assistant.md#74-automatic-fallback)

**"I tested the model before trusting it."**
The local provider needed a small model and one was already installed — a 3B coding model. One `curl` against the real contract showed it printing tool calls as **text in `content`** instead of a `tool_calls` array, which the agent loop would have rendered to the customer as raw JSON. `llama3.2:3b`, the same size, returns the correct shape because it ships a tool-calling chat template. **Two models of the same size can differ on whether a feature exists at all.** [05 §8.5](05-ai-assistant.md#85-3b-is-not-a-specification)

**"Guardrails are features."**
It can't take payments, can't advance a booking past Pending, can't see another customer's data, and can't write without a click. Each is a deliberate boundary, not a missing feature.

---

## 5. Weaknesses — own them first

Volunteering these reads as judgement. Being caught out by them doesn't.

**No automated tests.** The biggest gap. The layering makes services testable — the seams exist, the tests don't. Say what you'd write first: `BookingService` status-transition rules and `AssistantToolExecutor` argument validation, because that's where the real logic lives.

**No AI evaluation suite.** Prompt changes are verified by hand. A fixed set of conversations asserting the right tools get called is the obvious next step, and it's how you'd catch a prompt edit breaking tool selection.

**Payment is a status change,** not a gateway integration.

**Refetch-on-navigate.** Fine at this size, first thing to fix at scale.

**Some rough naming.** `Jobworklogcontroller`, `ITokenRepositiry` — a typo now baked into a public interface. Worth noticing that renaming a public interface is a wider change than it looks.

**Conversations don't survive a refresh.** A consequence of the stateless design; `sessionStorage` softens it. The trade was no new tables and no migrations, which was right for the goal.

---

## 6. If they ask you to extend it live

Have a rough answer ready.

**"Add an admin assistant."** The infrastructure exists. New tool definitions, an executor branch, a role check on the controller. The interesting part isn't the code — it's that admin tools cross customer boundaries, so the "id from the JWT" trick no longer scopes anything, and you'd need explicit authorization per tool.

**"Add email notifications."** A hosted service watching status transitions, or an event raised from the service layer. Point out you'd want it out-of-process so a failed email never fails a booking.

**"Make the chat stream."** Server-sent events, `stream: true` on the provider call. Note the wrinkle: tool calls arrive in fragments, so you buffer until the tool call is complete and only stream the final text turn.

---

## 7. Numbers worth remembering

|                         |                                                   |
| ----------------------- | ------------------------------------------------- |
| Roles                   | 3 — Admin, Customer, Mechanic                     |
| Booking statuses        | 10, `Pending`(0) → `Paid`(8), plus `Cancelled`(9) |
| Controllers / endpoints | 10 controllers, ~60 endpoints                     |
| Services / repositories | 8 services, 8 repositories                        |
| AI tools                | 13 — 6 read, 6 write, 1 navigation                |
| AI backends             | 2 — Groq `gpt-oss-120b`, Ollama `llama3.2:3b`     |
| Access token            | 15 minutes, HS256                                 |
| Refresh token           | 7 days, HTTP-only cookie                          |
| Max agent iterations    | 6                                                 |

---

_Back to: [Documentation index](README.md)_

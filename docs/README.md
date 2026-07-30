# AutoFix — Project Documentation

Full documentation for the AutoFix garage management system: a React customer/staff portal backed by an ASP.NET Core API, with an AI assistant that lets customers run the whole portal by conversation.

This set is written for two audiences at once — **someone picking the project up**, and **me, preparing to talk about it in an KT**.

---

## Start here

| #   | Document                                   | Read it when you want to know…                           |
| --- | ------------------------------------------ | -------------------------------------------------------- |
| 01  | [Project Overview](01-project-overview.md) | What the product is, who uses it, the business workflow  |
| 02  | [Architecture](02-architecture.md)         | How the pieces fit, auth flow, data model, key decisions |
| 03  | [Backend Guide](03-backend.md)             | .NET project structure, layers, full API reference       |
| 04  | [Frontend Guide](04-frontend.md)           | React structure, routing, state, theming, screens        |
| 05  | [**AI Assistant**](05-ai-assistant.md)     | **The centrepiece — tool calling, safety, real bugs**    |
| 06  | [Setup & Run](06-setup-and-run.md)         | Getting it running on a fresh machine                    |
| 07  | [KT Guide](07-KT-guide.md)                 | Talking points, likely questions, honest weaknesses      |

---

## The 60-second version

**AutoFix** digitises a car service garage. Three roles share one system:

- **Customers** register vehicles, book services, watch repair progress, and pay bills.
- **Admins** confirm bookings, assign mechanics, manage the service catalogue and staff, and raise invoices.
- **Mechanics** see their assigned jobs, log work done, and move jobs through the repair stages.

A booking moves through a **ten-stage lifecycle** from _Pending_ to _Paid_, and each role can only advance the stages it owns.

On top of that sits the **AI assistant** — a customer can type _"my brakes are squealing"_ and get a diagnosis, a real price from the live catalogue, and a one-click booking, without touching a single form.

### Stack at a glance

|              |                                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite 8, Redux Toolkit, React Router 7, SCSS, react-hook-form     |
| **Backend**  | ASP.NET Core (.NET 10), EF Core 10, SQL Server, ASP.NET Identity, Serilog  |
| **Auth**     | JWT access tokens (15 min) + HTTP-only refresh cookie (7 days), role-based |
| **AI**       | Any OpenAI-compatible provider (currently Groq), server-side tool calling  |

### Repositories

| Repo                   | Contents                                    |
| ---------------------- | ------------------------------------------- |
| `AutoFix`              | React frontend — **and this documentation** |
| `Auto-Garage-Solution` | ASP.NET Core Web API                        |

---

## What makes this project worth discussing

Three things are genuinely non-obvious, and each has its own section:

1. **The AI assistant is a real integration, not a chat widget.** It calls the same scoped service layer the controllers do, so it inherits the signed-in customer's permissions rather than getting a privileged data path. → [05](05-ai-assistant.md)

2. **Writes are never performed by the model.** The assistant _proposes_; a human clicks _Confirm_; a separate endpoint re-validates and commits. → [05 §6](05-ai-assistant.md#6-safety-the-confirmation-pattern)

3. **The booking lifecycle is a role-partitioned state machine.** No role can skip a stage or perform another role's transition. → [02](02-architecture.md)

---

_Last updated: 30 July 2026_

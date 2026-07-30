# Project Overview

## 1. The problem

A car service garage runs on phone calls, a whiteboard and paper job cards. Customers ring to ask _"is my car ready?"_. The owner writes down who is working on what. Bills are typed up at the end. Nothing is searchable, and nobody has the same picture of the day.

**AutoFix** turns that into one system that all three parties share.

---

## 2. The three roles

| Role         | Who they are              | What they do here                                                             |
| ------------ | ------------------------- | ----------------------------------------------------------------------------- |
| **Customer** | The car owner             | Register vehicles, book services, track repairs, view and pay invoices        |
| **Admin**    | Garage owner / front desk | Confirm bookings, assign mechanics, manage services and staff, raise invoices |
| **Mechanic** | Workshop staff            | See assigned jobs, log work and parts, advance repair status                  |

Roles are fixed — exactly these three, assigned at registration. Customers self-register; staff accounts are created by an Admin.

---

## 3. The core object: a booking

Everything in the system revolves around a **service booking** — one vehicle, one service, one date, moving through a lifecycle.

### The booking lifecycle

```
  Pending ──► Confirmed ──► AssignedToMechanic ──► InProgress ──► QualityCheck
     │                                                  ▲   │
     │                                                  └───┘
     │                                          WaitingForParts
     │                                                        │
     │                                                        ▼
     └──────────────► Cancelled                          Completed
                                                              │
                                                              ▼
                                                      InvoiceGenerated
                                                              │
                                                              ▼
                                                            Paid
```

| #   | Status               | Set by         | Meaning                          |
| --- | -------------------- | -------------- | -------------------------------- |
| 0   | `Pending`            | Customer       | Just booked, awaiting the garage |
| 1   | `Confirmed`          | Admin          | Garage accepted the booking      |
| 2   | `AssignedToMechanic` | Admin          | A mechanic now owns the job      |
| 3   | `InProgress`         | Mechanic       | Work has started                 |
| 4   | `WaitingForParts`    | Mechanic       | On hold for spares               |
| 5   | `QualityCheck`       | Mechanic       | Final inspection                 |
| 6   | `Completed`          | Mechanic       | Ready for handover               |
| 7   | `InvoiceGenerated`   | Admin          | Bill raised                      |
| 8   | `Paid`               | Customer       | Settled                          |
| 9   | `Cancelled`          | Customer/Admin | Called off                       |

**The rule worth remembering:** _a customer can only change a booking while it is still `Pending`._ Once the garage has confirmed it, the customer can look but not touch — they must call the garage. This single rule shapes a lot of the UI and all of the AI assistant's write tools.

_Defined in `Models/DomainModels/ServiceBookingModel/BookingStatus.cs`._

---

## 4. End-to-end journey

Follow one repair the whole way through — this is the story to tell in a kt.

**1. Customer registers a vehicle**
Make, model, year, licence plate, fuel type. Plates are unique per customer.

**2. Customer books a service**
Picks a vehicle and a service from the catalogue. The price is **snapshotted onto the booking** at this moment (`BookedBasePrice`) — if the garage raises prices next week, this customer still pays what they were quoted. A vehicle with an active booking cannot be booked again.

**3. Admin confirms**
Booking moves `Pending → Confirmed`. From here the customer can no longer edit or cancel it themselves.

**4. Admin assigns a mechanic**
`Confirmed → AssignedToMechanic`. The job now appears on that mechanic's dashboard.

**5. Mechanic works the job**
Marks it `InProgress`, logs work items and parts used in the **job work log**, may park it in `WaitingForParts`, then `QualityCheck`, then `Completed`. Every transition is recorded in the booking's **status history** with who changed it and when — this is what powers the customer's tracking timeline.

**6. Admin raises the invoice**
`Completed → InvoiceGenerated`. The invoice carries line items, tax and a total.

**7. Customer pays**
`InvoiceGenerated → Paid`. Done.

---

## 5. Supporting concepts

**Service catalogue** — the services the garage offers, each with a name, base price and estimated hours. Admin-managed. Services are _deactivated_, never deleted, so historical bookings keep their meaning.

**Soft deletes throughout** — vehicles and services become inactive rather than disappearing. Service history must survive.

**Status history** — every booking keeps an append-only trail of status changes with actor and timestamp. This is the audit log and the customer-facing progress timeline in one.

**Job work log** — mechanics record what they actually did and which parts they used, which feeds the eventual invoice.

---

## 6. Where the AI fits

Everything above is available through normal tabs and forms. The AI assistant is a **second interface to the same system** — the customer describes what they need in plain language and the assistant does the navigating, reading and form-filling.

It is scoped to the **Customer** role only. It can do everything a customer can do, and structurally cannot do anything they cannot — including seeing anyone else's data, taking payments, or advancing a booking past `Pending`.

→ [The AI Service Assistant](05-ai-assistant.md)

---

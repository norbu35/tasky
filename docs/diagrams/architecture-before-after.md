# Architecture Before vs After

## Before (Synchronous Side Effects In Request Path)

```mermaid
flowchart LR
  A["Accept / Pay / Complete API"] --> B["Core State Transition"]
  B --> C["Messaging"]
  B --> D["Notifications"]
  B --> E["Analytics"]
  B --> F["Wallet Credit"]

  note1["Risk: user-facing latency includes all side-effects"]
  note2["Risk: partial failure in side-effect chain can break request"]
  note3["Risk: no durable replay for transient downstream failure"]

  C -.-> note1
  D -.-> note2
  E -.-> note1
  F -.-> note3
```

## After (Durable Outbox + Async Processing)

```mermaid
flowchart LR
  A["Accept / Pay / Complete API"] --> B["Core State Transition"]
  B --> C["Write Domain Outbox Event (same DB)"]
  C --> D["Background Outbox Processor"]
  D --> E["Messaging"]
  D --> F["Notifications"]
  D --> G["Analytics"]
  D --> H["Wallet Credit"]

  r1["Benefit: request path is shorter and more predictable"]
  r2["Benefit: retries with durable event record"]
  r3["Benefit: processing lease recovers stuck PROCESSING events"]

  C -.-> r2
  D -.-> r1
  D -.-> r3
```

## Read Path Optimization

```mermaid
flowchart LR
  Q["Task / Booking list queries"] --> IDX["Composite indexes (V9)"]
  IDX --> P95["Lower sort/scan cost and improved p95 list latency"]
```

## Change Summary

- `acceptApplication`, payment callback, and booking completion now publish durable outbox events for side-effects.
- Side-effects (conversation bootstrap, notifications, analytics, wallet settlement) are processed asynchronously with
  retry.
- Outbox processing now uses a lease to recover events left in `PROCESSING` after crashes.
- Read-heavy listing flows now use new composite indexes (`tasks`, `task_applications`, `bookings`).

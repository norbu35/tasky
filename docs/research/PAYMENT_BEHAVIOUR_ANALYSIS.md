# Payment Behaviour Analysis: On-Platform Settlement in Mongolia

*Context: Will Mongolians pay a newly started platform before service completion? What prevents
off-platform settlement? Can on-platform payment be enforced?*

---

## The Core Question

Can a new gig platform in Mongolia require upfront payment before users trust it?

**Short answer: No — and attempting to force it will kill adoption.**

Payment escrow is a *trust product*, not a payment product. You cannot build payment behaviour
before you have built platform trust. A brand-new platform asking a customer to park money
before a stranger shows up faces three unanswerable objections:

- *"What if the tasker doesn't come? Will I get it back?"*
- *"What if the work is bad? Can I get a refund?"*
- *"Why would I trust an app I've never heard of with my money?"*

QPay itself is trusted — 3.2M users, near-universal adoption. The *platform holding QPay
funds* is not trusted. These are different things.

---

## What Actually Stops Off-Platform Settlement?

Nothing — if the platform gives both parties each other's contact details and allows free
direct communication. The moment they can reach each other directly, the economic incentive
is clear: avoid the eventual 10–15% fee by settling in cash.

The platforms that solved this didn't force payment behaviour. They controlled **information
flow** so that bypassing the platform was harder than using it.

### The Mechanism: Information Asymmetry

This is how Airbnb, Fiverr, and Upwork prevent leakage:

| What the platform controls                                                       | Why it prevents leakage                                                         |
|----------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Tasker's phone number is never shown — in-app messaging only                     | Customer cannot reach tasker off-platform without effort                        |
| Exact task address revealed only after booking confirmed *and* payment committed | Tasker cannot show up without going through the platform flow                   |
| Dispute resolution available only for on-platform bookings                       | Off-platform dispute = no recourse; both parties know this                      |
| Reviews accumulate only for on-platform completions                              | A tasker with 50 reviews has a strong reputational stake in staying on-platform |

**The PRD already applies this logic for location** (REQ-TASK-03: exact address hidden until
booking confirmed). It does not apply the same logic to **contact details**. If a customer
can see the tasker's phone number after application, they can arrange the job and pay in
cash. The phone number should never be visible — only in-app chat, only after booking is
confirmed.

---

## Why Some Leakage is Structurally Unavoidable

Home services have a fundamental structural difference from ride-hailing:

- **Ride-hailing:** The platform mediates the entire service in real-time (GPS, in-app
  payment, trip completion). Going off-platform is practically impossible mid-trip.
- **Home services:** The platform does the match. Then both parties are physically together
  for 2–4 hours with no platform involvement. That window is the leakage opportunity.

This is true of every home services marketplace globally — Handy, Helpling, Urban Company,
Bark.com all experience it. The goal is not elimination but **making on-platform more
attractive than off-platform**:

- Repeat bookings are frictionless on-platform (one tap to rebook same tasker)
- Tasker's reputation is platform-captive (reviews, rating, Pro badge only exist on Tasky)
- Dispute resolution is platform-exclusive (off-platform = no recourse)
- Future insurance/guarantee features make on-platform economically superior

---

## The Graduation Strategy: What Actually Works

### Stage 1 — First 3 months (zero brand recognition)

Cash on completion is acceptable. The platform's only job is proving:

- Verified taskers actually show up
- Matching quality is better than Facebook groups
- The app experience is smooth

Every successful cash-settled job is a trust data point. Do not try to force payment
behaviour before trust is established.

### Stage 2 — After 200+ bookings: QPay as incentivised option

Introduce QPay payment with visible benefits:

- MNT 5,000–10,000 booking credit for first digital payment
- "Secure Booking" badge visible to taskers when customer pays digitally
- Taskers who accept digital get a "Preferred" visibility boost

Let users opt in. The goal is **habit formation**, not enforcement.

### Stage 3 — After QPay habit established: escrow

Customer pays at booking confirmation; funds held in platform escrow; automatically released
4 hours after completion (or earlier if customer marks done). The tasker knows exactly when
payment hits — this is now the expected flow, not a new imposition.

The transition from Stage 2 to Stage 3 is the critical moment. By this point, both parties
have the QPay flow as a habit. Breaking it to go offline requires effort, coordination, and
forfeits the review both parties have come to value.

---

## Specific Product Mechanisms That Reinforce On-Platform Settlement

### Information control (highest leverage)

1. **Never expose tasker phone numbers.** In-app messaging only. Contact details are never
   shown — not in profiles, not in booking confirmations, not anywhere in the UI.
2. **Gate location reveal to payment commitment.** With QPay escrow: exact address is only
   released after payment is confirmed. The tasker physically cannot complete the job without
   going through the payment flow first.
3. **Communication history is dispute evidence.** All messages through the platform are
   logged and available for dispute resolution. This alone is a reason to keep communication
   on-platform.

### Reputation mechanics (medium leverage)

4. **Reviews are mandatory, not optional.** Gate the customer's next booking on completing
   the review. Gate the tasker's ability to apply to new tasks until they've rated the
   customer. Reviews that don't happen don't build trust.
5. **Review system is platform-exclusive.** A tasker with 80 five-star reviews is not going
   to risk that reputation to save MNT 5,000 (the fee on a MNT 50,000 job). The reputational
   asset must be made credible and valuable early.

### Economic mechanics (lower leverage early, higher later)

6. **Repeat booking convenience.** One tap to rebook same tasker. Off-platform means finding
   the number, texting, negotiating, no scheduling confirmation. Platform wins on convenience
   for repeat bookings.
7. **Platform credits accumulate.** On-platform payment earns credits redeemable on next
   booking. Creates a mini loyalty program that makes on-platform cheaper over time.
8. **Future guarantee (post-MVP).** If Tasky eventually offers a completion guarantee (re-do
   or partial refund for unsatisfactory work), on-platform bookings become economically
   superior. Off-platform has zero guarantee.

---

## When to Introduce the Take Rate

**The take rate introduction is the highest-risk moment for leakage.** If introduced too
early, before habits are formed, it triggers immediate off-platform negotiation.

Rule of thumb: do not introduce a platform fee until at least 40% of active customers have
completed 3+ bookings. At that point, the habit and the reputational stakes are sufficient
to absorb a fee.

Early taskers should be grandfathered at a lower rate (per the business strategy: 5% for
Phase 1 cohort vs. 10–15% for new taskers). This creates a loyalty incentive and reduces
the shock of monetisation for the supply side that built the platform.

---

## Comparison: How Comparable Platforms Handled This

| Platform             | Market                                                   | Payment approach                                                                                      | Leakage strategy                                                                                           |
|----------------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| **inDrive**          | Central Asia, LatAm (trust dynamics similar to Mongolia) | Cash between driver and rider — platform does NOT intermediate payment                                | Makes money through ads and premium features; explicitly chose not to force payment due to trust barriers  |
| **Urban Company**    | India                                                    | Started with cash on completion; introduced digital payment after trust established; now escrow-style | No phone number exposure; location only after booking; dispute resolution platform-exclusive               |
| **Airbnb**           | Global                                                   | Upfront payment from day one                                                                          | Host address not revealed until booking paid; communication through platform only; review system mandatory |
| **UBCab**            | Mongolia                                                 | In-app payment (QPay-integrated)                                                                      | Real-time GPS mediation makes off-platform impractical; direct analog for Mongolia digital payment habits  |
| **Handy / Helpling** | US/Europe                                                | Upfront card payment                                                                                  | Information control + subscription model for repeat bookings                                               |

**Takeaway:** inDrive's approach (no platform payment intermediation) is not the right model
for Tasky because it eliminates the trust differential over Facebook groups. Airbnb's upfront
model is correct in principle but requires brand trust that a new platform doesn't have.
Urban Company's graduation strategy — cash first, then digital, then escrow — is the most
directly applicable playbook.

---

## Summary

| Question                                       | Answer                                                                                 |
|------------------------------------------------|----------------------------------------------------------------------------------------|
| Will Mongolians pay upfront to a new platform? | No — not at first; forcing it kills adoption                                           |
| What prevents off-platform settlement?         | Information control (no contact details), reputation stakes, dispute access            |
| Can on-platform payment be forced?             | Not on day one; must be earned through trust graduation                                |
| What's the right payment strategy?             | Cash acceptable in Stage 1 → QPay incentivised in Stage 2 → Escrow standard in Stage 3 |
| When to introduce take rate?                   | Only after 40%+ of active customers have 3+ bookings                                   |
| Most important product decision?               | Never expose contact details; all communication in-app only                            |

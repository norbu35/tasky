# AGENTS.md

## Project Identity

**Project Name:** Tasky  
**Mission:** Build Mongolia's most trusted and efficient domestic service marketplace.

---

## 0. Document Governance

*This file is the controlling instruction set for project execution by both humans and LLM agents.*

### Scope and Precedence

1. This document defines binding project doctrine, delivery rules, and quality gates.
2. Document precedence is:
    1. `AGENTS.md` (this file)
    2. PRD
    3. Architecture and API specs
    4. Sprint plans and tickets
3. If lower-level documents conflict with this file, this file wins until formally amended.

### Ownership and Change Control

1. Required owners: Product Lead, Engineering Lead, and Security Lead.
2. Changes to this file require:
    1. PR with explicit rationale
    2. Impact summary on scope, timeline, and risk
    3. Approval from at least two owners, including Engineering Lead
3. Every major decision must be logged in an ADR (`/docs/adr`) with status and date.

### Conflict Resolution Rule

If principles conflict, follow the higher-priority principle from Section 1 and record tradeoff details in the ADR and
PR notes.

---

## 1. Project Doctrine (Opening Manifesto)

*These are immutable project laws. Every decision must align with these values.*

1. **User trust over growth**  
   Safety, reliability, and fair dispute handling come before feature velocity.
2. **Local reality over generic best practice**  
   Optimize for Mongolia first: language, payments, pricing, logistics, regulation, and behavior.
3. **Problem-solution fit over feature count**  
   Build only what measurably improves task completion, booking success, repeat usage, and retention.
4. **Marketplace liquidity is the core system constraint**  
   Prioritize supply-demand balance by district, category, and time.
5. **Mobile-first execution, multi-platform consistency**  
   React Native is the primary UX; web parity is intentional and contract-driven.
6. **API contracts are the source of truth**  
   Versioned OpenAPI contracts are authoritative for backend and all clients.
7. **Security and privacy by default**  
   Least privilege, secure coding, auditability, and PII protection are mandatory from day one.
8. **Simple architecture first, evolvable later**  
   Start with a modular monolith and clean boundaries; increase complexity only when metrics justify it.
9. **Quality is enforced, not implied**  
   "Done" requires tests, observability, CI checks, and document updates.
10. **LLM is a copilot, never final authority**  
    LLM output must pass human review, objective acceptance criteria, and automated checks.

---

## 2. Product Scope and Success Metrics

*Refer to `/docs/PRD.md` for the authoritative Scope, MVP definition, and Success Metrics.*

---

## 3. Strategic Implementation Guidelines

*Translate principles into concrete architecture and execution decisions.*

### Contract-Driven Development (API First)

1. OpenAPI spec is authored before implementation changes.
2. Backend, web, and mobile must conform to the contract.
3. TypeScript SDK is generated from OpenAPI and consumed by both React and React Native.
4. Contract-breaking changes require version bump and migration notes.

### Security-First and Trust-Driven Architecture

1. All high-risk operations (identity changes, booking state changes, payments, disputes) must be auditable.
2. Every financial and state transition event must produce immutable audit records.
3. Authorization must be role-based and resource-scoped.

### Market-Specific Localization (Mongolia Native)

1. Full i18n support from day one, default language Mongolian (Cyrillic).
2. Local address model must use Pin-drop (Lat/Long) + Mandatory Text Description (formal addresses are secondary).
3. Currency, date/time, and phone formats must match local expectations.

### Frontend Design System Governance

1. Web UI primitives MUST use `shadcn/ui` as the base component system.
2. Mobile MUST use platform-native components driven by the same shared design tokens and state semantics used by web.
3. Additional web component frameworks are forbidden unless approved by ADR.
4. UI changes are not complete without accessibility evidence (keyboard behavior and contrast checks for web flows
   touched).

### External Provider Strategy (Decision Gates, Not Assumptions)

1. Candidate providers:
    1. Payments: QPay (MVP), SocialPay/Cards (Post-MVP)
    2. Identity and trust: Manual Review (MVP), approved local KYC (Post-MVP)
    3. Maps/geocoding: Google Maps and local alternatives
2. Provider selection must pass:
    1. Commercial fit
    2. Legal and compliance validation
    3. Technical reliability and supportability
3. Every critical integration requires fallback or graceful degradation behavior.

### Scalable Domain-Driven Design

1. Start as a modular monolith in Spring Boot.
2. Organize by domain boundaries (user, task, booking, payment, dispute, notification).
3. Enforce module boundaries through package structure and ownership.

---

## 4. Architecture and Technology Baseline

### Backend

1. Java 21
2. Spring Boot 3.x
3. PostgreSQL + PostGIS
4. Spring Security (JWT based on SMS OTP auth)
5. Docker and containerized local development

### Web Client

1. React 18+
2. TypeScript
3. Vite
4. `shadcn/ui`-based component system and shared API SDK consumption

### Mobile Client

1. React Native (Expo, unless native modules force bare workflow)
2. TypeScript
3. Shared API SDK and design token consumption
4. Graceful error handling for connectivity loss (Marketplace requires connection)

### Cross-Cutting Technical Standards

1. Monorepo or multi-repo is allowed, but contract and versioning discipline is mandatory.
2. All services and clients must expose health checks and version metadata.
3. Structured logging with correlation IDs is required end to end.

---

## 5. Quality Engineering and Test Policy

*No release without evidence. No evidence without automation.*

### Mandatory Test Layers

1. Backend unit tests for domain logic and validation
2. Backend integration tests (DB, cache, queue, external adapters) using realistic environments
3. API contract tests (producer and consumer)
4. Web unit/component tests and E2E tests
5. Mobile unit/component tests and E2E tests
6. Security tests for auth, authorization, injection, and abuse paths
7. Performance tests for critical flows before each production release

### Coverage and Quality Gates

1. Coverage target: 80%+ on critical business modules (coverage is a guardrail, not sole quality proof).
2. CI must block merge on:
    1. Failing tests
    2. Contract drift
    3. High or critical security findings
    4. Lint and static analysis failures
3. Flaky tests must be quarantined with owner and fix deadline; they do not justify bypassing gates.

### Definition of Done

A work item is done only when code, tests, observability, rollback plan, and relevant docs are updated and approved.

---

## 6. Security and Privacy Baseline

### Security Controls

1. Least privilege across users, services, and infrastructure identities.
2. Secrets managed via secure secret storage, never hardcoded in code or CI.
3. Encryption in transit (TLS) and at rest for sensitive data.
4. Mandatory input validation and output encoding on all external boundaries.
5. Dependency and container image scanning in CI.

### Privacy and Compliance Controls

1. Data classification policy for PII, financial data, and operational logs.
2. Data retention and deletion policy must be documented before production launch.
3. Access to production PII is logged, reviewed, and restricted by role.
4. Incident response playbook for data exposure events is required.

### Security Process

1. Threat modeling is required for every high-risk feature (payments, identity, dispute flows).
2. Security review is required before enabling any new external integration in production.

---

## 7. Reliability, Operations, and SRE Baseline

### SLO/SLI Starter Targets (Revise with Real Traffic)

1. API availability: 99.5% monthly minimum
2. Booking success flow: 99.0% successful completion for non-user-error attempts
3. p95 API latency for core booking endpoints: less than 500 ms under normal load

### Incident and Recovery Standards

1. Severity model (SEV1-SEV3) must be defined and documented.
2. On-call rotation and escalation path are required before public launch.
3. Disaster recovery targets:
    1. RTO: 4 hours
    2. RPO: 15 minutes
4. Backup and restore drills must run at least once per quarter.

### Observability Requirements

1. Metrics, logs, and traces are required for all critical user flows.
2. Alerts must map to user impact, not only infrastructure signals.
3. Each release must include dashboard and alert updates if behavior changed.
4. MVP funnel analytics events must be emitted for task-post, application, accept, payment, completion, and dispute
   milestones.

---

## 8. Delivery Model and Program Controls

### Delivery Strategy

1. Build in vertical slices: auth, profile, task posting, matching, booking, payment, ratings, disputes, and
   cross-platform design system.
2. Each slice must ship with tests, telemetry, and operational readiness.
3. Prefer short milestones with demoable outcomes over long speculative branches.

### Definition of Ready

Work cannot start unless it has:

1. Clear business objective
2. Acceptance criteria
3. API and data impact notes
4. Test strategy
5. Risk assessment

### Release Gates

Production release requires:

1. All CI gates passing
2. Migration and rollback plans validated
3. SRE and support readiness confirmed
4. Release notes and known risks documented

---

## 9. Standard Operating Procedures (SOPs) for LLM and Human Teams

### LLM Usage Policy

1. LLMs are used for acceleration (scaffolding, tests, refactors, docs), never as an unverified authority.
2. Every AI-generated change must be reviewed by a responsible engineer.
3. Prompts for code generation must include context, constraints, acceptance criteria, and test expectations.

### Engineering Workflow Rules

1. Branch naming:
    1. Human-created branches: `feature/*`, `fix/*`, `chore/*`, `hotfix/*`
    2. LLM agent branches: `agent/<ticket>-<slug>`
2. PR requirements:
    1. Linked ticket
    2. Risk summary
    3. Test evidence
    4. Rollback notes when relevant
3. Required approvals:
    1. Minimum one domain owner
    2. Additional security approval for high-risk changes

### Documentation Rules

1. All public endpoints must have OpenAPI documentation.
2. Complex logic must include rationale comments that explain why.
3. Any architectural change must include an ADR update.
4. UI-impacting tickets must document component parity and token usage in ticket acceptance criteria.

### Non-Negotiables

1. Never bypass quality gates to meet a date.
2. Never deploy unreviewed security-sensitive code.
3. Never merge contract-breaking changes without versioning and migration guidance.

---

## 10. Git Commit and Quality Gate Policy

*Risk-tiered gates are mandatory. Optimize for safety and speed through parallel CI and selective depth based on change
risk.*

### 10.1 Branch and Commit Rules

1. All LLM agent work MUST use branch format: `agent/<ticket>-<slug>`.
2. Direct commits to `main` are forbidden.
3. One commit MUST represent one logical change.
4. Every runtime code commit MUST include related tests in the same commit or PR.
5. Commits that fail local mandatory checks MUST NOT be pushed.
6. Merge blockers:
    1. Secrets in code, commit history, or logs
    2. Disabled tests without approved quarantine notes
    3. Placeholder security logic in auth, payment, wallet, dispute, or admin paths
7. All Gradle commands MUST run through `./gradlew`; system `gradle` is forbidden for project tasks and CI gates.

### 10.2 Commit Message Contract

1. Subject format: `<type>(<scope>): <imperative summary>`.
2. Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`.
3. Commit body MUST include:
    1. `Ticket: <id>`
    2. `Spec: <REQ-IDs from PRD>`
    3. `API: <endpoint(s) changed or "no API change">`
    4. `Tests: <what was added/updated>`
    5. `Risk: <low|medium|high>`

### 10.3 Risk Classification

1. Low risk:
    1. Documentation, comments, non-runtime config, test-only changes
2. Medium risk:
    1. Runtime behavior changes without auth, payment, schema, external integration, or security-boundary changes
3. High risk:
    1. Auth, payment, wallet, dispute, security, DB migrations, API contract changes, or external integration changes

### 10.4 Required Checks by Risk

1. Low risk checks:
    1. Format and lint
    2. Commit message lint
    3. Secret scan
    4. Ticket spec validation
    5. Changed-module tests
    6. Acceptance criteria coverage gate
2. Medium risk checks:
    1. All low risk checks
    2. OpenAPI contract validation
    3. Integration tests for touched modules
    4. Coverage gate on touched critical modules
3. High risk checks:
    1. All medium risk checks
    2. Full test suite (unit, integration, and E2E where applicable)
    3. SAST and dependency vulnerability scan
    4. Migration verification on clean database
    5. Performance smoke tests for critical endpoints

### 10.5 Pull Request Gate and Merge Policy

1. PR MUST include:
    1. Linked ticket
    2. Risk level
    3. Changed REQ IDs
    4. Test evidence
    5. Rollback notes (when relevant)
2. Required approvals:
    1. Low/medium risk: at least one domain owner
    2. High risk: at least two approvals, including security or architecture owner
3. Merge is blocked if any required check fails.
4. Contract-breaking API changes require version bump and migration guidance.
5. Preferred merge strategy is squash merge to keep `main` history readable.
6. CI MUST infer risk from changed files and block PRs if declared risk is lower than inferred risk.
7. CI required jobs for merge:
    1. Self-verification parity gate
    2. Web/mobile workspace typecheck and tests
    3. Dependency vulnerability scan
    4. Container image vulnerability scan

### 10.6 Performance Rules for Fast Delivery

1. CI jobs MUST run in parallel where possible.
2. Path-based test selection is allowed for low and medium risk PRs.
3. Full regression suite MUST run nightly on `main`.
4. Build and dependency caches MUST be enabled in CI.
5. CI MUST fail fast on lint, spec validation, and secret scan before expensive stages.

### 10.7 Agent-Specific Non-Negotiables

1. LLM-generated code MUST NOT be merged without human review.
2. If implementation and documentation conflict, code and docs MUST be updated in the same PR.
3. If requirements are unclear, stop implementation and request clarification before coding.

### 10.8 Self-Verification Gate (Mandatory Before Commit and Push)

1. Every agent change MUST run self-verification before commit and before each PR update.
2. Self-verification MUST produce evidence at `artifacts/self-verify.json` with:
    1. Ticket ID
    2. Risk level
    3. REQ IDs covered
    4. Files changed
    5. Checks executed
    6. Acceptance criteria and test mapping evidence
    7. Pass/fail status
    8. Known risks and assumptions
3. Required checks by risk:
    1. Low: lint, commit message lint, secret scan, ticket spec validation, changed-module tests, AC coverage gate
    2. Medium: low plus integration tests plus OpenAPI validation
    3. High: medium plus full test suite plus security scan plus migration safety verification and performance smoke
4. The agent MUST run a self-critique and record:
    1. What requirement is most likely to break?
    2. What security or abuse path is impacted?
    3. Which test proves the intended behavior?
5. If any required check fails, commit and push are blocked until fixed.
6. For pull requests, the local report at `artifacts/self-verify.json` MUST be included in the branch for CI parity
   checks.
7. CI MUST re-run the same verification independently. Any mismatch between local report and CI result is a merge
   blocker.
8. After each self-verification run, the agent MUST append an entry to `docs/agent/WORK_LOG.md`.

### 10.9 Canonical Self-Verify Artifact Schema

1. Canonical schema path: `docs/quality/self-verify.schema.json`.
2. Canonical risk-check registry path: `docs/quality/risk-checks.json`.
3. The artifact `artifacts/self-verify.json` MUST validate against this schema.
4. Unknown or undocumented fields are forbidden. Agents MUST use schema version `1.0.0`.
5. Required check IDs and required check sets per risk level are defined by the risk-check registry and enforced in CI.
6. Bootstrap exception: if repository has no commits yet, `git_context.head_sha` MUST be `NO_HEAD`.

### 10.10 Self-Verify Script Contract

1. Canonical contract path: `docs/quality/SELF_VERIFY_CONTRACT.md`.
2. Canonical runner path: `scripts/self-verify.sh`.
3. Minimum CLI contract:
    1.
   `scripts/self-verify.sh --ticket <TICKET-ID> --risk <low|medium|high> --req <REQ-IDS-CSV> [--ticket-spec <path>] [--base <git-ref>] [--only <check-id>] [--out <path>]`
4. Mandatory script behavior:
    1. Resolve changed files from Git.
       If repository has no `HEAD`, use the empty tree base and set `git_context.head_sha` to `NO_HEAD`.
    2. Select required checks from risk level.
    3. Execute required fast checks first (`format_lint`, `commit_message_lint`, `secret_scan`, `openapi_validation`
       when required).
    4. If fast checks pass, execute remaining required checks.
    5. If a fast check fails, do not run expensive checks; record each remaining required check as blocked `FAIL` with
       command and reason.
    6. Capture command, duration, exit code, and status for every required check entry.
    7. Validate ticket spec and branch-ticket consistency before running expensive checks.
    8. Validate acceptance-criteria coverage using executed test logs.
       Test runners must emit test titles so `TID-*` identifiers are visible in logs.
    9. Produce `artifacts/self-verify.json`.
    10. Validate artifact against `docs/quality/self-verify.schema.json` before exiting.
5. Mandatory exit codes:
    1. `0`: all required checks passed
    2. `1`: one or more required checks failed
    3. `2`: invalid script usage
    4. `3`: artifact schema validation failed
    5. `4`: environment or tooling failure

### 10.11 Agent Work Log Contract

1. Canonical log path: `docs/agent/WORK_LOG.md`.
2. Canonical logger path: `scripts/agent-log.sh`.
3. The log is append-only; entries are never edited or deleted except by documented corrective ADR.
4. Each entry MUST include timestamp, context (`local|ci|manual`), ticket, branch, risk, overall status, check pass
   count, and artifact path.
5. If work log append fails, self-verification is considered failed due to traceability gap.

---

## 11. Multi-Agent Task Coordination

*This section governs parallel agent execution. Multiple agents MAY work on different tickets simultaneously, provided
they follow this coordination protocol.*
Canonical operational checklist: `docs/agent/RUNBOOK.md`.

### 11.1 Coordination File

1. Canonical path: `tickets/STATUS.json`.
2. This file is the single source of truth for ticket assignment and progress.
3. It MUST be committed to the repository and pushed to the remote.
4. Git commit + push acts as the atomic lock for claiming tickets.

### 11.2 Ticket Statuses

1. `pending`: Not started. No agent is working on it.
2. `in_progress`: Claimed by an agent. The `agent`, `branch`, and `claimed_at` fields identify the owner.
3. `done`: Implementation complete, self-verification passed, PR merged (or equivalent).

### 11.3 Coordination Scripts

1. **Canonical entrypoint**: `scripts/agent-flow.sh` — unified `status|start|verify|complete|finish|merge` workflow.
2. **Status check**: `scripts/ticket-status.sh` — displays current state, available tickets, blocked tickets, and next
   recommended ticket.
3. **Start+Claim**:
   `scripts/agent-flow.sh start --agent <name> [--ticket <ID>] [--slug <slug>] [--workspace shared|isolated] [--worktree-root <path>] [--auto-claim]` —
   resumes existing in-progress work or claims a selected ticket (default workspace is `isolated`).
4. **Claim (internal/debug)**: `scripts/claim-ticket.sh --agent <name> [--ticket <ID>] [--branch <branch>]` — atomically
   claims a ticket.
5. **Complete**: `scripts/complete-ticket.sh --ticket <ID> [--artifact <path>]` — marks a ticket as done.
6. **Finish (verify+complete)**: `scripts/agent-flow.sh finish --ticket <ID>` — runs verify then complete in one step.
7. **Merge to Main**: `scripts/agent-flow.sh merge --ticket <ID> [--main-branch <main|master>]` — merges the completed
   worktree branch into `main` as the final step. Includes automatic rebase when the source branch has diverged from
   `main`.

### 11.4 Agent Startup Protocol (MANDATORY)

Every agent MUST follow this sequence when starting a new work session:

1. **Orient**: Run `scripts/agent-flow.sh status` to see the current state.
   ```bash
   scripts/agent-flow.sh status
   ```
2. **Select**: Identify the next available ticket. A ticket is "available" when:
    - Its status is `pending` in `tickets/STATUS.json`.
    - ALL tickets listed in its `depends_on` (from `tickets/<TICKET>.json`) have status `done`.
3. **Resume-or-Claim**: `start` is deterministic:
    - If this agent already owns exactly one `in_progress` ticket, `start` MUST resume that ticket.
    - If this agent owns none, `start` MUST require explicit `--ticket` for new claims (or `--auto-claim` to pick the
      next available ticket).
    - If this agent owns multiple `in_progress` tickets, `start` MUST fail and require explicit `--ticket`.
4. **Workspace**: Use isolated workspaces for concurrent local agents.
   ```bash
   scripts/agent-flow.sh start --agent <your-agent-name> --ticket <TICKET-ID> --slug <slug>
   ```
5. **Fallback (single-agent only)**: Shared workspace mode is allowed when no other local agent is running.
   ```bash
   scripts/agent-flow.sh start --agent <your-agent-name> --ticket <TICKET-ID> --slug <slug> --workspace shared
   ```
6. **Implement**: Follow the development workflow in Section 7 of `docs/ARCHITECTURE.md`.
7. **Self-verify**: Run `scripts/self-verify.sh` with the ticket's risk level and requirements.
   Preferred wrapper:
   ```bash
   scripts/agent-flow.sh verify --ticket <TICKET-ID>
   ```
8. **Complete**: After successful self-verification, mark the ticket done.
   ```bash
   scripts/agent-flow.sh complete --ticket <TICKET-ID>
   ```
   **Preferred alternative**: Use `finish` to combine steps 7 and 8 in a single command:
   ```bash
   scripts/agent-flow.sh finish --ticket <TICKET-ID>
   ```
9. **Merge to Main**: As the final step, merge the completed task branch into `main`.
   If another agent has merged first and `main` has advanced, the merge command automatically rebases the source branch
   before fast-forwarding.
   ```bash
   scripts/agent-flow.sh merge --ticket <TICKET-ID>
   ```

### 11.5 Parallel Execution Rules

1. Two agents MUST NOT claim the same ticket. The `claim-ticket.sh` script enforces this via git push atomicity.
2. If a push fails during claim (race condition), the script pulls, re-evaluates available tickets, and retries
   automatically (up to 3 attempts).
3. Agents SHOULD prefer the lowest-numbered available ticket for deterministic ordering, unless a specific ticket is
   strategically better.
4. An agent MUST NOT start work on a ticket whose dependencies are not all `done`. The claim script enforces this.
5. Multiple agents MAY work in parallel on independent tickets (e.g., TASK-004 and TASK-020 can run simultaneously since
   they share no dependencies beyond done tickets).
6. Simultaneous local agents MUST use isolated workspaces (`git worktree`) to avoid branch and file collisions in a
   single checkout.
7. One local workspace maps to one active ticket branch.
8. `start --ticket <ID>` MUST fail if `<ID>` is `in_progress` and owned by a different agent.

### 11.6 Stale Claim Recovery

1. If an agent crashes or abandons work, its ticket remains `in_progress` indefinitely.
2. A human or admin agent MAY reset a stale claim by editing `tickets/STATUS.json` to set the ticket back to `pending` (
   removing `agent`, `branch`, and `claimed_at` fields).
3. Before resetting, verify the agent's branch does not contain valuable partial work.

### 11.7 Quick Reference for New Agents

```
# 1. See what's happening
scripts/agent-flow.sh status

# 2. Start a specific ticket
scripts/agent-flow.sh start --agent my-agent-name --ticket TASK-020 --slug my-work

# 3. Optional: auto-claim next available ticket
scripts/agent-flow.sh start --agent my-agent-name --slug my-work --auto-claim

# 4. Run verification using ticket metadata defaults
scripts/agent-flow.sh verify --ticket TASK-020

# 5. After done: mark ticket complete
scripts/agent-flow.sh complete --ticket TASK-020

# 4+5 combined: verify then complete in one step
scripts/agent-flow.sh finish --ticket TASK-020

# 6. Finalize by merging into main
scripts/agent-flow.sh merge --ticket TASK-020
```

### 11.8 Workspace Utilization Model (Local Parallelism)

1. Default isolated workspace root is `.worktrees`.
2. Deterministic path format: `.worktrees/<agent>/<TICKET-ID>`.
3. `start` (default isolated workspace) MUST:
    1. Resolve ticket
    2. Create/switch branch `agent/<ticket>-<slug>`
    3. Create/reuse isolated worktree path
    4. Claim ticket from inside that worktree
4. Agent output MUST include the resolved worktree path so the process can continue implementation in the correct
   workspace.
5. Shared workspace mode MUST be treated as single-agent fallback only.

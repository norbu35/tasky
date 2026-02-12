# CLAUDE.md - Tasky Project Context

## Project Identity
- **Name:** Tasky
- **Mission:** Mongolia's most trusted domestic service marketplace
- **Stage:** MVP (v1.0)
- **Architecture:** Modular Monolith

## Tech Stack
- **Backend:** Java 21, Spring Boot 3.x, JDBI 3 (not JPA), PostgreSQL 16 + PostGIS, Flyway migrations
- **Auth:** Spring Security + JWT, SMS OTP login
- **Web:** React 18, Vite, TailwindCSS, TanStack Query
- **Mobile:** React Native (Expo), NativeWind, React Navigation
- **API Client:** TypeScript SDK generated from OpenAPI spec
- **File Storage:** MinIO (local dev), AWS S3 (prod) via presigned URLs
- **Async:** Spring @Async + ApplicationEventPublisher, Postgres-backed job_queue for critical tasks
- **Geospatial:** PostGIS with GiST index, ST_DWithin for radius searches
- **Payments:** QPay (MVP)
- **Notifications:** FCM/Expo Push + SMS fallback
- **Local Dev:** docker-compose (app, db, minio)

## Domain Modules
1. **identity** - Auth, User Profiles, KYC/Verification
2. **marketplace** - Task Posting, Search, Booking State Machine
3. **wallet** - Internal Ledger, QPay Integration, Payouts
4. **communication** - Notifications (Push/SMS), In-app Messaging
5. **support** - Disputes, Moderation, Admin Tools

## Key Business Rules
- Users authenticate via Phone + SMS OTP only
- Users can activate Tasker role before verification; verification approval gates tasker actions
- Taskers require Gov ID upload + manual admin approval before working
- Tasks have fixed budgets (no hourly pricing)
- Location model: Pin-drop (Lat/Long) + mandatory text description
- Payment flow: Customer pays 100% upfront via QPay -> funds held -> released on completion minus platform fee
- Wallet model: Tasker earns to internal wallet, requests manual payout
- Payout schedule: fixed Tue/Fri processing by admin
- Platform fee: configurable (default 10%)
- Customer cancellation: free >4h before start, 10% fee (min 5k MNT) if <4h
- Tasker cancellation: full refund to customer, task reverts to OPEN; 3 strikes in 30 days = 7-day suspension
- Pro Badge: auto-assigned at >5 completed jobs AND >4.5 avg rating
- Disputes: available during PAID booking (work in progress) or within 24h of COMPLETED, pauses payout
- In-app messaging: WebSocket (Spring WebSocket + STOMP), available after Tasker applies to a task
- Task categories: database-managed, admin can add/edit/deactivate
- Task photos: max 3 per task, uploaded via presigned URL
- Offline support: read-only cache of "My Tasks" on mobile (AsyncStorage)
- [x] Default language: Mongolian (Cyrillic), full i18n from day one
- Currency: MNT (Mongolian Tugrik)

## Status Lifecycles (Dual Model)
- **Task:** OPEN -> ASSIGNED -> COMPLETED | CANCELLED
- **Booking:** PENDING_PAYMENT -> PAID -> COMPLETED | CANCELLED

## API Conventions
- REST, JSON, OpenAPI 3.0.3 as source of truth
- URI versioning: /api/v1/...
- Cursor-based pagination on all list endpoints: { data: [], cursor: { next, has_more } }
- Idempotency-Key header on payment and critical irreversible state-changing endpoints
- Standardized error format: { code, message, trace_id }
- Auth: Bearer JWT in Authorization header
- Rate limiting: token bucket per IP/User
- Input validation: JSR-380 Bean Validation on all DTOs

## Document Precedence
1. AGENTS.md (project doctrine)
2. docs/PRD.md (product requirements)
3. docs/ARCHITECTURE.md + docs/API.yaml (technical specs)
4. Sprint plans and tickets

## Development Workflow
1. Update API.yaml first (contract-driven)
2. Generate DTOs/interfaces from OpenAPI
3. Implement controller + JDBI repositories
4. Test with Testcontainers + PostgreSQL integration tests

## Quality Gates
- 80%+ coverage on critical business modules
- CI blocks on: failing tests, contract drift, high/critical security findings, lint failures
- Branch naming: human `feature/*|fix/*|chore/*|hotfix/*`; LLM agent `agent/<ticket>-<slug>`
- PRs require: linked ticket, risk summary, test evidence, rollback notes

## Non-Negotiables
- Never bypass quality gates for deadlines
- Never deploy unreviewed security-sensitive code
- Never merge contract-breaking changes without versioning and migration guidance
- All PII encrypted at rest
- Structured JSON logging with trace_id and user_id end-to-end

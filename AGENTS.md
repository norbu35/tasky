# Agent Instructions

## Workflow Overview

There are two agent roles. The same agent may play both in one session, or they may be separate sessions.

### 1. Planning: Requirement → Tasks

The user describes what they want in plain language. The planning agent:

1. Reads `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/API.yaml` to understand what exists
2. Asks clarifying questions until the requirement is unambiguous
3. Breaks the requirement into tasks using `scripts/task.sh add "Title"`
4. Fills in each task file with a description and "Done When" criteria
5. Sets priority and dependencies between tasks

### 2. Implementation: Task → Branch → PR

The implementation agent:

1. Runs `scripts/task.sh next` to find available work
2. Runs `scripts/task.sh start TASK-ID` to claim it and create a branch
3. Reads the task file and implements what's described
4. Writes tests for every "Done When" criterion
5. Runs all checks locally (see "How to Submit Work")
6. Updates `CHANGELOG.md`, marks the task done, pushes, and opens a PR
7. The user reviews the PR and merges it

## Writing Good Tasks

A task should be a **vertical slice** deliverable in one PR. It touches one feature across the necessary layers (DB → backend → API spec → frontend). If a feature is too large for one PR, split by user-facing capability, not by technical layer.

**Task file format** (`tasks/TASK-NNN.md`):

```markdown
# TASK-NNN: Short imperative title

**Status:** todo
**Priority:** high
**Depends on:** TASK-NNN (optional)

## Description
2-5 sentences: what the user wants, what needs to change, which layers are involved.
Reference specific endpoints, tables, or screens when possible.

## Done When
- Each criterion is concrete and testable
- Mention specific endpoints, validation rules, or UI behaviors
- Include contract updates (API.yaml, SDK regen) if endpoints change
- Bad: "search works well" — Good: "GET /api/v1/tasks?district=X returns tasks within 5km"
```

**Priority values:** `critical`, `high`, `medium`, `low`

**Dependencies:** `scripts/task.sh next` automatically skips tasks whose dependencies aren't `done`.

## Before Starting Any Task

Read these files first:
- `docs/ARCHITECTURE.md` — system design, domain packages, persistence patterns
- `docs/API.yaml` — skim the OpenAPI spec for the area you're working in
- The relevant domain package under `src/main/java/mn/tasky/` — understand existing patterns before adding code

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, JDBI 3 (explicit SQL, not JPA), PostgreSQL + PostGIS, Flyway migrations
- **Web:** React 18, TypeScript, Vite, Radix UI + Tailwind (shadcn conventions, no CLI)
- **Mobile:** React Native (Expo), TypeScript
- **Monorepo:** pnpm workspaces — `apps/web/`, `apps/mobile/`, `packages/sdk/`, `packages/design-tokens/`
- **API client:** Always consume `@tasky/sdk` (generated from `docs/API.yaml`), never hand-write fetch calls

## Code Conventions

- Follow existing patterns in the codebase
- TypeScript: strict mode, no `any`, no `as` casts without justification, prefer `const`
- Java: full type annotations, JDBI for persistence, Spring `@Transactional` for atomic operations
- Web components: Radix UI + Tailwind in `apps/web/src/components/ui/`. No MUI, Chakra, or Ant
- Mobile: platform-native components driven by shared design tokens. No Radix/shadcn on mobile
- Use `structlog` patterns for logging, never `System.out.println`

## API-First Development

For any endpoint change:
1. Update `docs/API.yaml` first
2. Run `pnpm sdk:generate` to regenerate the TypeScript SDK
3. Then implement the backend and frontend changes
4. Never hand-write request/response types that exist in the generated SDK

## How to Pick Up Work

```bash
scripts/task.sh next          # see the next available task
scripts/task.sh start TASK-ID # set to in-progress, create branch
```

Read the task file in `tasks/`. The "Done When" section defines what you need to deliver.

## How to Submit Work

1. Ensure all checks pass locally:
   ```bash
   ./gradlew test
   ./gradlew openApiValidate
   pnpm -r typecheck
   pnpm -r test
   ```
2. Update `CHANGELOG.md` with a one-line summary of what you did
3. Run `scripts/task.sh done TASK-ID`
4. Push the branch and open a PR

## PR Description

Every PR must include:
- What the task asked for
- What you changed (files, endpoints, schemas)
- How you verified it (which tests you wrote/updated)
- Anything you're unsure about

## Testing

- Every "Done When" criterion needs a corresponding test
- For changes touching **auth, payments, wallet, migrations, or SecurityConfig**: write both positive and negative tests (happy path works AND unauthorized/invalid attempts are rejected). Call this out in the PR description
- Backend: JUnit 5 + Spring Boot Test. Integration tests use `@SpringBootTest` with Testcontainers
- Web: Vitest + React Testing Library
- Mobile: Jest + React Native Testing Library

## What Not to Do

- Don't gut or simplify `SecurityConfig.java` — subagents have broken it before
- Don't use the Postgres owner account (`POSTGRES_USER`) for runtime connections — use `APP_DB_USER`
- Don't add component libraries (MUI, Chakra, Ant Design) — the design system is Radix + Tailwind
- Don't hardcode secrets — use environment variables
- Don't bypass PgBouncer for runtime database connections
- Don't hand-write API types that should come from `@tasky/sdk`

## Branch Naming

```
agent/TASK-{id}-{slug}
```

## Commit Messages

```
type(scope): imperative summary
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`

AI commits must include:
```
Co-Authored-By: Pi <noreply@pi.dev>
```

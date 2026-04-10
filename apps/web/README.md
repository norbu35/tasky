# Tasky Web

React web client for the Tasky domestic services marketplace.

## Tech Stack

| Component | Version / Library |
|-----------|------------------|
| Framework | React 18.3 + Vite 5.4 |
| Routing | React Router DOM 6 |
| Styling | Tailwind CSS 3.4 + tailwind-merge |
| UI Components | Radix UI primitives + shadcn/ui patterns (CVA + clsx) |
| Animations | Framer Motion 12 |
| Server State | TanStack React Query 5 |
| Realtime | STOMP.js + SockJS (WebSocket chat) |
| Maps | pigeon-maps |
| i18n | i18next + browser language detector |
| Theme | next-themes (light/dark) |
| Toasts | Sonner |
| Icons | Lucide React |
| Error Handling | react-error-boundary |
| Date Utils | date-fns |
| Shared Packages | `@tasky/core`, `@tasky/sdk` |

## Project Structure

```
src/
  App.tsx              Root component
  AppShell.tsx          Authenticated app shell (layout + providers)
  main.tsx             Entry point
  styles.css           Global styles + Tailwind directives
  components/
    ui/                Reusable UI primitives (shadcn/ui pattern)
    feature/           Feature-specific compound components
    landing/           Landing page sections
    task-creation/     Task creation wizard components
  context/
    AppContext.ts       App-wide React context
  layout/              Layout components (nav, sidebar, responsive shell)
  lib/                 API client, utility functions
  locales/
    en/                English translations
    mn/                Mongolian translations
  pages/               Page components (one per route)
    admin/             Admin dashboard pages
  router/              Route definitions and guards
  test/                Test setup and utilities
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| LandingPage | `/` | Public marketing page |
| AuthPage | `/auth` | Login / registration |
| CustomerDashboardPage | `/dashboard` | Customer home |
| CustomerTaskPage | `/tasks` | Browse/create tasks |
| CustomerTaskDetailsPage | `/tasks/:id` | Task detail view |
| BookingConfirmationPage | `/booking/confirm` | Confirm a booking |
| BookingSafetyPage | `/booking/safety` | Safety information |
| TaskerFeedPage | `/tasker/feed` | Tasker task feed |
| TaskerTasksPage | `/tasker/tasks` | Tasker's accepted tasks |
| ProfilePage | `/profile` | User profile |
| MessagingNotificationsPage | `/messages` | Chat and notifications |
| RestrictedAccountPage | `/restricted` | Account restriction notice |
| Admin pages | `/admin/*` | Admin dashboard |

## Internationalization

Two locales: English (`en`) and Mongolian (`mn`) with browser language auto-detection.

## Testing

| Type | Tool | Command |
|------|------|---------|
| Unit / Component | Vitest + React Testing Library | `pnpm test:unit` |
| Coverage | Vitest + v8 | `pnpm test:coverage` |
| E2E | Playwright (Chromium) | `pnpm test:e2e` |
| E2E Smoke | Playwright (@smoke tag) | `pnpm test:e2e:smoke` |

## Development

```bash
pnpm install                       # Install dependencies (from monorepo root)
pnpm --filter @tasky/web dev       # Start Vite dev server
pnpm --filter @tasky/web build     # Production build (typecheck + bundle)
pnpm --filter @tasky/web preview   # Preview production build
```

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Vite dev server with HMR |
| `build` | TypeScript check + Vite production build |
| `preview` | Serve production build locally |
| `typecheck` | TypeScript type checking |
| `lint` | ESLint |
| `format` | Prettier auto-format |
| `test:unit` | Run Vitest unit tests |
| `test:coverage` | Unit tests with coverage report |
| `test:e2e` | Full Playwright E2E suite |
| `test:e2e:smoke` | Smoke E2E tests only |

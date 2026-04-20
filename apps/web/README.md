# Tasky Web

React web client for the Tasky domestic services marketplace.

## Tech Stack

| Component       | Version / Library                                     |
| --------------- | ----------------------------------------------------- |
| Framework       | React 19 + Vite 8                                     |
| Routing         | React Router DOM 7                                    |
| Styling         | Tailwind CSS 4 + tailwind-merge                       |
| UI Components   | Radix UI primitives + shadcn/ui patterns (CVA + clsx) |
| Animations      | Framer Motion 12                                      |
| Server State    | TanStack React Query 5                                |
| Realtime        | STOMP.js + SockJS (WebSocket chat)                    |
| Maps            | pigeon-maps                                           |
| i18n            | i18next + browser language detector                   |
| Toasts          | Sonner                                                |
| Icons           | Lucide React                                          |
| Error Handling  | react-error-boundary                                  |
| Date Utils      | date-fns                                              |
| Shared Packages | `@tasky/core`, `@tasky/sdk`                           |

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

| Page                | Route             | Description                                                                   |
| ------------------- | ----------------- | ----------------------------------------------------------------------------- |
| LandingPage         | `/`               | Public marketing page (redirects to dashboard/feed if authenticated)          |
| AuthPage            | `/auth`           | Login / registration                                                          |
| **Customer routes** | `/customer/*`     | Dashboard, tasks (CRUD + applicants), bookings (lifecycle + disputes), rebook |
| **Tasker routes**   | `/tasker/*`       | Feed, my-tasks, jobs, bookings, stats, privacy, verification flow             |
| **Profile routes**  | `/profile/*`      | View, edit, settings, delete                                                  |
| InboxPage           | `/inbox`          | Chat list and conversation detail                                             |
| BookingSafetyPage   | `/booking/safety` | Safety information                                                            |
| Admin pages         | `/admin/*`        | Verifications, disputes, users, categories, features, concierge, moderation   |

See `src/router/AppRoutes.tsx` for the full route tree (~40 routes).

## Internationalization

Two locales: English (`en`) and Mongolian (`mn`) with browser language auto-detection.

## Testing

| Type             | Tool                           | Command               |
| ---------------- | ------------------------------ | --------------------- |
| Unit / Component | Vitest + React Testing Library | `pnpm test:unit`      |
| Coverage         | Vitest + v8                    | `pnpm test:coverage`  |
| E2E              | Playwright (Chromium)          | `pnpm test:e2e`       |
| E2E Smoke        | Playwright (@smoke tag)        | `pnpm test:e2e:smoke` |

## Development

```bash
pnpm install                       # Install dependencies (from monorepo root)
pnpm --filter @tasky/web dev       # Start Vite dev server
pnpm --filter @tasky/web build     # Production build (typecheck + bundle)
pnpm --filter @tasky/web preview   # Preview production build
```

## Scripts

| Script           | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `dev`            | Vite dev server with HMR                 |
| `build`          | TypeScript check + Vite production build |
| `preview`        | Serve production build locally           |
| `typecheck`      | TypeScript type checking                 |
| `lint`           | ESLint                                   |
| `format`         | Prettier auto-format                     |
| `test:unit`      | Run Vitest unit tests                    |
| `test:coverage`  | Unit tests with coverage report          |
| `test:e2e`       | Full Playwright E2E suite                |
| `test:e2e:smoke` | Smoke E2E tests only                     |

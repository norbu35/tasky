# Mobile API Wiring Design

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Wire all mobile screens to the backend API, replacing mock/demo data with real API calls.

## Problem

The mobile app has 10 screens covering both core user loops, but only 3 (TaskFeed, BookingList, Profile) are wired to the backend. The remaining screens use hardcoded demo data or have unconnected callback props. This blocks end-to-end testing and launch.

## Approach

Hook-per-domain with screen rewrites. Follows the existing pattern established by `useTasks.ts`, `useBookings.ts`, and `useProfile.ts` — Zustand auth store for token access, React Query for server state, `createMobileApiClient()` for HTTP calls.

## 1. API Client Changes

### New methods on `MobileApiClient` interface and `HttpMobileApiClient`

```typescript
listApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>>
// GET /tasks/{taskId}/applications

rescheduleBooking(
    accessToken: string,
    bookingId: string,
    payload: { proposed_scheduled_at: string; reason?: string },
    idempotencyKey: string
): Promise<BookingScheduleEvent>
// POST /bookings/{bookingId}/reschedule
// Requires Idempotency-Key header. Returns 201 with BookingScheduleEvent body.

getPublicProfile(accessToken: string, userId: string): Promise<Profile>
// GET /users/{userId}
// Note: If this endpoint doesn't exist yet, extract tasker profile data from
// the TaskApplication or Booking embedded objects as a fallback.

cancelBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>
// Already exists in API client — listed here for hook coverage completeness.
```

### Updated method signature

`submitReview` payload changes from `{ rating: number; comment?: string }` to per-category ratings matching the `booking_reviews` schema:

```typescript
submitReview(
    accessToken: string,
    bookingId: string,
    payload: {
        quality_rating?: number;
        punctuality_rating?: number;
        communication_rating?: number;
        clarity_rating?: number;
        respectfulness_rating?: number;
        comment?: string | null;
    }
): Promise<Review>
```

**Breaking change:** This replaces the old `{ rating, comment }` signature. The `HttpMobileApiClient` implementation (line 421-434) must be updated simultaneously. No other consumers exist in the codebase — the ReviewForm component was just created and its `onSubmit` callback is the only caller.

**Key mapping:** The `ReviewForm` component emits `ReviewPayload.ratings` with keys `qualityOfWork`, `punctuality`, `communication`, `taskDescriptionClarity`, `respectfulness`. The `useSubmitReview` hook must map these to API field names:
- `qualityOfWork` → `quality_rating`
- `punctuality` → `punctuality_rating`
- `communication` → `communication_rating`
- `taskDescriptionClarity` → `clarity_rating`
- `respectfulness` → `respectfulness_rating`

Customer-to-Tasker reviews send `quality_rating`, `punctuality_rating`, `communication_rating`.
Tasker-to-Customer reviews send `clarity_rating`, `respectfulness_rating`, `punctuality_rating`.

## 2. New React Query Hooks

All hooks follow the established pattern: import `useAuthStore` for token, import `createMobileApiClient`, return `useQuery` or `useMutation`.

| Hook | File | Type | Wraps | Cache Invalidation |
|------|------|------|-------|--------------------|
| `useApplications(taskId)` | `features/tasks/hooks/useApplications.ts` | query | `listApplications` | key: `['applications', taskId]` |
| `useCreateTask()` | `features/tasks/hooks/useCreateTask.ts` | mutation | `createTask` | invalidates `['tasks']` |
| `useAcceptApplication()` | `features/bookings/hooks/useAcceptApplication.ts` | mutation | `acceptApplication` | invalidates `['bookings']`, `['applications']`, `['tasks']` |
| `useCompleteBooking()` | `features/bookings/hooks/useCompleteBooking.ts` | mutation | `completeBooking` | invalidates `['bookings']`, `['booking']` |
| `useCancelBooking()` | `features/bookings/hooks/useCancelBooking.ts` | mutation | `cancelBooking` | invalidates `['bookings']`, `['booking']`, `['tasks']` |
| `useBookingDetail(bookingId)` | `features/bookings/hooks/useBookingDetail.ts` | query | `getBooking` | key: `['booking', bookingId]` |
| `useSubmitReview()` | `features/review/hooks/useSubmitReview.ts` | mutation | `submitReview` | invalidates `['booking']`, `['bookings']`, `['taskerProfile']` |
| `useReschedule()` | `features/bookings/hooks/useReschedule.ts` | mutation | `rescheduleBooking` | invalidates `['booking', bookingId]` |
| `useTaskerProfile(userId)` | `features/profile/hooks/useTaskerProfile.ts` | query | `getPublicProfile` + `getUserReviews` | key: `['taskerProfile', userId]` |

**Note on prefix invalidation:** `invalidateQueries({ queryKey: ['applications'] })` uses TanStack Query's default prefix matching, so it invalidates all `['applications', *]` keys. This is intentional.

## 3. Screen Rewrites

### TaskPostWizard
- `handlePost()` calls `useCreateTask().mutateAsync()` with collected form data
- **Payload transformation required:**
  - `selectedCategory` (key string) → `category_id` (UUID): resolve via `listCategories` data cached from TaskFeed
  - `location` (freetext) → `location_text` (string) + `location_lat`/`location_lng`: use 0/0 placeholder until map picker is implemented; text is passed through
  - `scheduleDate` + `scheduleTime` → `scheduled_at` (ISO 8601): combine as `${scheduleDate}T${scheduleTime}:00`
  - `budget` (string) → `budget` (number): `parseInt(budget, 10)`
  - `scopeSummary` → `description`
- On success: navigate back, show success toast
- On failure: show error toast, keep form state

### CustomerTaskDetail
- Route: `app/task/[id].tsx` where `[id]` is the **task ID**
- Uses `useLocalSearchParams<{ id: string }>()` to extract the task ID
- Fetches the associated booking via `useBookings()` filtered by task ID, or accepts a booking object passed via route state
- "Mark Complete" button calls `useCompleteBooking().mutateAsync()`
- "Reschedule" opens `RescheduleModal`. The modal emits `{ date, time, reason }`. The parent combines date+time into ISO format (`${date}T${time}:00`) before calling `useReschedule().mutateAsync()`
- "Message Tasker" navigates to existing chat screen with conversation ID from booking

### TaskerPublicProfile
- Route: `app/profile/[id].tsx` where `[id]` is the user ID
- Uses `useTaskerProfile(userId)` which calls `getPublicProfile(userId)` + `getUserReviews(userId)`
- **Fallback:** If `GET /users/{userId}` doesn't exist, extract profile data from the `TaskApplication` or `Booking` embedded tasker object passed via route state
- "Book a Session" navigates to task creation with category pre-selected

### ApplicantsList
- Route: `app/task/[id]/applicants.tsx` where `[id]` is the task ID
- Uses `useApplications(taskId)` — replaces `MOCK_APPLICANTS`
- Accept button calls `useAcceptApplication().mutateAsync()`, then navigates to BookingConfirmation
- "View Profile" navigates to `app/profile/[id]` with applicant's user ID

### NotificationCenter
- Phase 0: remains mock data (no notification list endpoint exists; notifications are push-only)
- Phase 2 TODO: wire to notification polling or WebSocket subscription

## 4. New Expo Router Routes

```
app/task/[id].tsx              → CustomerTaskDetail (task ID param)
app/task/[id]/applicants.tsx   → ApplicantsList (task ID param)
app/profile/[id].tsx           → TaskerPublicProfile (user ID param)
```

All routes use `useLocalSearchParams<{ id: string }>()` to extract the `id` segment.

`BookingConfirmation` and `ReviewForm` are presented as modals from parent screens, not standalone routes.

## 5. Error Handling & Loading

- Queries: `isLoading` renders skeleton (existing `TaskCardSkeleton` pattern)
- Queries: `isError` renders retry card
- Mutations: `isError` shows error Toast (existing `Toast` component)
- Mutations requiring idempotency generate UUID keys via `crypto.randomUUID()`
- Optimistic updates for `completeBooking` and `cancelBooking`: update query cache immediately, roll back on error via `onError` + `queryClient.setQueryData` restore

## 6. Out of Scope

- Notification list API endpoint (doesn't exist yet — Phase 2)
- Real-time WebSocket integration for notifications
- Photo upload flow (presigned URL upload exists in API client but camera/gallery picker not implemented)
- Map pin-drop integration (location is text-only for now; lat/lng default to 0/0)
- Geocoding service integration
- Category key-to-UUID resolution beyond using cached categories from the feed
- Offline caching beyond React Query's default 5-minute stale time

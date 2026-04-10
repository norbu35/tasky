# History-Based Location Presets

**Date:** 2026-04-10
**Status:** Approved

## Problem

The task creation location screen shows 3 hardcoded quick-location chips ("Home", "Work", "Sukhbaatar Square") that only set the text field — they don't move the map pin and are the same for every user. They provide no value to returning customers who repeatedly post tasks at the same addresses.

## Solution

Replace the static chips with the customer's 3 most recent distinct task locations. Tapping a preset sets both the map pin and the location text. When no history exists (new users), show an informational note instead.

## Design

### Backend: `GET /api/v1/tasks/mine/recent-locations`

**Auth:** Bearer token, CUSTOMER role only.

**Response:**
```json
{
  "locations": [
    {
      "location_lat": 47.9213,
      "location_lng": 106.9197,
      "location_text": "Сүхбаатар дүүрэг, 1-р хороо, 4-р байр"
    }
  ]
}
```

Returns up to 3 entries. Empty array if no task history.

**Query logic:**
1. Select from `tasks` where `customer_id = :userId` and `status IN ('OPEN', 'BOOKED', 'COMPLETED')`, ordered by `created_at DESC`, limit 50 candidates
2. In Java, iterate candidates and keep locations whose lat/lng are >200m from all already-kept locations (Euclidean distance on degrees — adequate at UB's latitude for a 200m threshold)
3. Stop at 3 accepted results

The deduplication is application-level over a bounded candidate set. This avoids complex recursive SQL while the candidate set is small.

**SQL sketch:**
```sql
SELECT location_lat, location_lng, location_text
FROM tasks
WHERE customer_id = :userId
  AND status IN ('OPEN', 'BOOKED', 'COMPLETED')
  AND location_lat IS NOT NULL
  AND location_lng IS NOT NULL
  AND location_text IS NOT NULL
ORDER BY created_at DESC
LIMIT 50
```

50 candidates (not 20) ensures a customer who repeatedly posts at one address still surfaces their less-frequent locations.

**Placement:** Follows existing pattern — endpoint under `TaskController` since it reads from the `tasks` table and is scoped to the authenticated customer. A new DAO method on `TaskDao`.

### Mobile: Location Screen Changes

**Data fetching:** Call `GET /tasks/mine/recent-locations` on mount (via a new `useRecentLocations` hook using React Query, key: `['recent-locations']`).

**Cache invalidation:** The `useCreateTask` mutation's `onSuccess` must invalidate `['recent-locations']` alongside the existing `['tasks']` invalidation, so a customer who creates a task and immediately starts another sees the fresh preset.

**When locations exist (1–3 results):**
- Render tappable chips showing truncated `location_text` (max ~30 chars with ellipsis)
- On tap: set the map pin to `{ latitude: location_lat, longitude: location_lng }`, animate the map camera there, set `locationText` to the full `location_text`, mark `userEditedText.current = true`

**When no locations exist (empty array):**
- Replace the chips area with an informational note: "Your recent locations will appear here after your first task." (i18n key: `LocationScreen.noRecentLocations`)

**Loading state:** Show a subtle skeleton/placeholder while the query is in flight — same width as chips, muted background. No spinner.

### What Gets Removed

- The `quickLocations` array (lines 163–167 of `location.tsx`)
- The 3 i18n keys: `quickLocationHome`, `quickLocationWork`, `quickLocationSukhbaatar`

### API.yaml Changes

Add the new endpoint under `/tasks/mine/recent-locations` with the response schema.

## Privacy

- Returns only the authenticated user's own task locations
- No new data exposure — these coordinates are already visible to the task owner via `/tasks/mine`

## Testing

- **Backend unit test:** DAO returns correct deduplication (2 tasks at same address → 1 result; 5 tasks at 4 addresses → 3 results)
- **Backend integration test:** Endpoint returns 200 with correct shape; empty for user with no tasks
- **Mobile:** Verify chips render from API data, tap sets pin + text, empty state shows note

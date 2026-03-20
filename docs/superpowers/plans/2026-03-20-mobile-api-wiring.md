# Mobile API Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all mobile screens to the backend API, replacing mock/demo data with real React Query hooks.

**Architecture:** Hook-per-domain pattern matching existing `useTasks.ts`/`useBookings.ts`/`useProfile.ts`. Zustand for auth tokens, React Query for server state, typed `HttpMobileApiClient` for HTTP. Three layers: API client methods → hooks → screen components.

**Tech Stack:** TypeScript, React Native, Expo Router, TanStack React Query, Zustand

**Spec:** `docs/superpowers/specs/2026-03-20-mobile-api-wiring-design.md`

---

## File Map

**API Client (modify):**
- `apps/mobile/src/lib/mobileApiClient.ts` — add 3 new methods, update 1 signature

**Hooks (create):**
- `apps/mobile/src/features/tasks/hooks/useApplications.ts`
- `apps/mobile/src/features/tasks/hooks/useCreateTask.ts`
- `apps/mobile/src/features/tasks/hooks/useCategories.ts`
- `apps/mobile/src/features/bookings/hooks/useAcceptApplication.ts`
- `apps/mobile/src/features/bookings/hooks/useCompleteBooking.ts`
- `apps/mobile/src/features/bookings/hooks/useCancelBooking.ts`
- `apps/mobile/src/features/bookings/hooks/useBookingDetail.ts`
- `apps/mobile/src/features/bookings/hooks/useReschedule.ts`
- `apps/mobile/src/features/review/hooks/useSubmitReview.ts`
- `apps/mobile/src/features/profile/hooks/useTaskerProfile.ts`

**Routes (create):**
- `apps/mobile/src/app/task/[id].tsx`
- `apps/mobile/src/app/task/[id]/applicants.tsx`
- `apps/mobile/src/app/profile/[id].tsx`

**Screens (modify):**
- `apps/mobile/src/features/tasks/components/TaskPostWizard.tsx`
- `apps/mobile/src/features/tasks/components/CustomerTaskDetail.tsx`
- `apps/mobile/src/features/tasks/components/ApplicantsList.tsx`
- `apps/mobile/src/features/profile/components/TaskerPublicProfile.tsx`

---

### Task 1: Add new API client methods

**Files:**
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`

- [ ] **Step 1: Add `listApplications` to interface (after line 80)**

```typescript
listApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>>;
```

- [ ] **Step 2: Add `BookingScheduleEvent` type export (after line 13)**

```typescript
export type BookingScheduleEvent = components["schemas"]["BookingScheduleEvent"];
```

- [ ] **Step 3: Add `rescheduleBooking` to interface (after line 102)**

```typescript
rescheduleBooking(
    accessToken: string,
    bookingId: string,
    payload: { proposed_scheduled_at: string; reason?: string },
    idempotencyKey: string
): Promise<BookingScheduleEvent>;
```

- [ ] **Step 5: Add `getPublicProfile` to interface (after line 48)**

```typescript
getPublicProfile(accessToken: string, userId: string): Promise<Profile>;
```

- [ ] **Step 6: Update `submitReview` interface signature (line 104-108)**

Replace:
```typescript
submitReview(
    accessToken: string,
    bookingId: string,
    payload: { rating: number; comment?: string | null }
): Promise<Review>;
```
With:
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
): Promise<Review>;
```

- [ ] **Step 7: Add `listApplications` implementation to `HttpMobileApiClient`**

```typescript
listApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>> {
    return this.requestJson<CursorPage<TaskApplication>>(
        `/tasks/${taskId}/applications`,
        { method: "GET" },
        accessToken,
        { limit: 100 }
    );
}
```

- [ ] **Step 8: Add `rescheduleBooking` implementation**

```typescript
rescheduleBooking(
    accessToken: string,
    bookingId: string,
    payload: { proposed_scheduled_at: string; reason?: string },
    idempotencyKey: string
): Promise<BookingScheduleEvent> {
    return this.requestJson<BookingScheduleEvent>(
        `/bookings/${bookingId}/reschedule`,
        {
            method: "POST",
            headers: { "Idempotency-Key": idempotencyKey },
            body: JSON.stringify(payload)
        },
        accessToken
    );
}
```

- [ ] **Step 9: Add `getPublicProfile` implementation**

```typescript
getPublicProfile(accessToken: string, userId: string): Promise<Profile> {
    return this.requestJson<Profile>(`/users/${userId}`, { method: "GET" }, accessToken);
}
```

- [ ] **Step 10: Update `submitReview` implementation (line 421-434)**

Replace the payload type in the implementation to match the new interface signature. The `JSON.stringify(payload)` call stays the same — it serializes whatever object is passed.

- [ ] **Step 11: Verify TypeScript compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`
Expected: no errors

- [ ] **Step 12: Commit**

```bash
git add apps/mobile/src/lib/mobileApiClient.ts
git commit -m "feat(mobile): add listApplications, rescheduleBooking, getPublicProfile API methods and update submitReview signature"
```

---

### Task 1.5: Add UUID utility for idempotency keys

React Native Hermes does not support `crypto.randomUUID()`. We need a utility.

**Files:**
- Create: `apps/mobile/src/utils/uuid.ts`

- [ ] **Step 1: Create UUID utility**

```typescript
export function generateIdempotencyKey(): string {
    // Hermes-compatible UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/utils/uuid.ts
git commit -m "feat(mobile): add Hermes-compatible UUID utility for idempotency keys"
```

**Note:** All subsequent tasks that need idempotency keys must import `generateIdempotencyKey` from `../../../utils/uuid` instead of using `crypto.randomUUID()`.

---

### Task 2: Create query hooks (read operations)

**Files:**
- Create: `apps/mobile/src/features/tasks/hooks/useApplications.ts`
- Create: `apps/mobile/src/features/tasks/hooks/useCategories.ts`
- Create: `apps/mobile/src/features/bookings/hooks/useBookingDetail.ts`
- Create: `apps/mobile/src/features/profile/hooks/useTaskerProfile.ts`

- [ ] **Step 1: Create `useApplications`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useApplications(taskId: string) {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['applications', taskId],
        queryFn: () => api.listApplications(token!, taskId),
        enabled: !!token && !!taskId,
    });
}
```

- [ ] **Step 2: Create `useCategories`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useCategories() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.listCategories(token!),
        enabled: !!token,
        staleTime: 1000 * 60 * 30, // categories rarely change
    });
}
```

- [ ] **Step 3: Create `useBookingDetail`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useBookingDetail(bookingId: string | undefined) {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    return useQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => api.getBooking(token!, bookingId!),
        enabled: !!token && !!bookingId,
    });
}
```

- [ ] **Step 4: Create `useTaskerProfile`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient, type Profile, type CursorPage, type Review } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useTaskerProfile(userId: string | undefined) {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;

    const profileQuery = useQuery({
        queryKey: ['taskerProfile', userId],
        queryFn: () => api.getPublicProfile(token!, userId!),
        enabled: !!token && !!userId,
    });

    const reviewsQuery = useQuery({
        queryKey: ['taskerReviews', userId],
        queryFn: () => api.getUserReviews(token!, userId!),
        enabled: !!token && !!userId,
    });

    return { profile: profileQuery, reviews: reviewsQuery };
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/tasks/hooks/useApplications.ts \
       apps/mobile/src/features/tasks/hooks/useCategories.ts \
       apps/mobile/src/features/bookings/hooks/useBookingDetail.ts \
       apps/mobile/src/features/profile/hooks/useTaskerProfile.ts
git commit -m "feat(mobile): add query hooks for applications, categories, booking detail, tasker profile"
```

---

### Task 3: Create mutation hooks (write operations)

**Files:**
- Create: `apps/mobile/src/features/tasks/hooks/useCreateTask.ts`
- Create: `apps/mobile/src/features/bookings/hooks/useAcceptApplication.ts`
- Create: `apps/mobile/src/features/bookings/hooks/useCompleteBooking.ts`
- Create: `apps/mobile/src/features/bookings/hooks/useCancelBooking.ts`
- Create: `apps/mobile/src/features/bookings/hooks/useReschedule.ts`
- Create: `apps/mobile/src/features/review/hooks/useSubmitReview.ts`

- [ ] **Step 1: Create `useCreateTask`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useCreateTask() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: {
            category_id: string;
            description: string;
            budget: number;
            location_lat: number;
            location_lng: number;
            location_text: string;
            scheduled_at: string;
            photo_keys?: string[];
        }) => api.createTask(token!, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
```

- [ ] **Step 2: Create `useAcceptApplication`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useAcceptApplication() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            taskId: string;
            applicationId: string;
            liabilityDisclaimerAccepted: boolean;
            idempotencyKey: string;
        }) => api.acceptApplication(
            token!,
            params.taskId,
            params.applicationId,
            params.liabilityDisclaimerAccepted,
            params.idempotencyKey
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
            void queryClient.invalidateQueries({ queryKey: ['applications'] });
            void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
```

- [ ] **Step 3: Create `useCompleteBooking`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useCompleteBooking() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { bookingId: string; idempotencyKey: string }) =>
            api.completeBooking(token!, params.bookingId, params.idempotencyKey),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
            void queryClient.invalidateQueries({ queryKey: ['booking'] });
        },
    });
}
```

- [ ] **Step 4: Create `useCancelBooking`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useCancelBooking() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { bookingId: string; idempotencyKey: string }) =>
            api.cancelBooking(token!, params.bookingId, params.idempotencyKey),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
            void queryClient.invalidateQueries({ queryKey: ['booking'] });
            void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
```

- [ ] **Step 5: Create `useReschedule`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useReschedule() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            bookingId: string;
            proposed_scheduled_at: string;
            reason?: string;
            idempotencyKey: string;
        }) => api.rescheduleBooking(
            token!,
            params.bookingId,
            { proposed_scheduled_at: params.proposed_scheduled_at, reason: params.reason },
            params.idempotencyKey
        ),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
        },
    });
}
```

- [ ] **Step 6: Create `useSubmitReview`**

Note the key mapping from ReviewForm's `ReviewPayload.ratings` to API field names.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

const RATING_KEY_MAP: Record<string, string> = {
    qualityOfWork: 'quality_rating',
    punctuality: 'punctuality_rating',
    communication: 'communication_rating',
    taskDescriptionClarity: 'clarity_rating',
    respectfulness: 'respectfulness_rating',
};

export function useSubmitReview() {
    const session = useAuthStore((s) => s.session);
    const token = session?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            bookingId: string;
            ratings: Record<string, number>;
            comment?: string;
        }) => {
            const payload: Record<string, number | string | null | undefined> = {
                comment: params.comment || null,
            };
            for (const [formKey, value] of Object.entries(params.ratings)) {
                const apiKey = RATING_KEY_MAP[formKey];
                if (apiKey) payload[apiKey] = value;
            }
            return api.submitReview(token!, params.bookingId, payload as any);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['booking'] });
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
            void queryClient.invalidateQueries({ queryKey: ['taskerProfile'] });
        },
    });
}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/features/tasks/hooks/useCreateTask.ts \
       apps/mobile/src/features/bookings/hooks/useAcceptApplication.ts \
       apps/mobile/src/features/bookings/hooks/useCompleteBooking.ts \
       apps/mobile/src/features/bookings/hooks/useCancelBooking.ts \
       apps/mobile/src/features/bookings/hooks/useReschedule.ts \
       apps/mobile/src/features/review/hooks/useSubmitReview.ts
git commit -m "feat(mobile): add mutation hooks for create task, accept, complete, cancel, reschedule, review"
```

---

### Task 4: Create Expo Router route files

**Files:**
- Create: `apps/mobile/src/app/task/[id].tsx`
- Create: `apps/mobile/src/app/task/[id]/applicants.tsx`
- Create: `apps/mobile/src/app/profile/[id].tsx`

- [ ] **Step 1: Create `app/task/[id].tsx`**

```typescript
import { Stack } from 'expo-router';
import { CustomerTaskDetail } from '../../features/tasks/components/CustomerTaskDetail';

export default function TaskDetailRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <CustomerTaskDetail />
        </>
    );
}
```

- [ ] **Step 2: Create directory and `app/task/[id]/applicants.tsx`**

```typescript
import { Stack } from 'expo-router';
import { ApplicantsList } from '../../../features/tasks/components/ApplicantsList';

export default function ApplicantsRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ApplicantsList />
        </>
    );
}
```

- [ ] **Step 3: Create `app/profile/[id].tsx`**

```typescript
import { Stack } from 'expo-router';
import { TaskerPublicProfile } from '../../features/profile/components/TaskerPublicProfile';

export default function TaskerProfileRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TaskerPublicProfile />
        </>
    );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/task/ apps/mobile/src/app/profile/
git commit -m "feat(mobile): add Expo Router routes for task detail, applicants, and tasker profile"
```

---

### Task 5: Wire TaskPostWizard to API

**Files:**
- Modify: `apps/mobile/src/features/tasks/components/TaskPostWizard.tsx`

- [ ] **Step 1: Add hook imports at top of file**

Add after existing imports:
```typescript
import { useCreateTask } from '../hooks/useCreateTask';
import { useCategories } from '../hooks/useCategories';
```

- [ ] **Step 2: Add hooks inside component body**

Inside `TaskPostWizard()`, after existing state declarations:
```typescript
const createTask = useCreateTask();
const { data: categoriesData } = useCategories();
const categories = categoriesData?.data ?? [];
```

- [ ] **Step 3: Replace `handlePost` with real API call**

Find the `handlePost` callback and replace `router.back()` with:
```typescript
const handlePost = useCallback(async () => {
    if (!selectedCategory) return;
    const categoryObj = categories.find(c => c.name.toLowerCase() === selectedCategory);
    const categoryId = categoryObj?.id ?? '';
    try {
        await createTask.mutateAsync({
            category_id: categoryId,
            description: scopeSummary,
            budget: parseInt(budget, 10) || 0,
            location_lat: 0,
            location_lng: 0,
            location_text: location,
            scheduled_at: scheduleDate && scheduleTime
                ? `${scheduleDate}T${scheduleTime}:00`
                : new Date().toISOString(),
            photo_keys: [],
        });
        router.back();
    } catch {
        // Error shown via Toast in mutation onError
    }
}, [selectedCategory, categories, scopeSummary, budget, location, scheduleDate, scheduleTime, createTask, router]);
```

- [ ] **Step 4: Disable Post button during submission**

On the Post Task button, add `isLoading={createTask.isPending}` prop.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/tasks/components/TaskPostWizard.tsx
git commit -m "feat(mobile): wire TaskPostWizard to createTask API"
```

---

### Task 6: Wire CustomerTaskDetail to API

**Files:**
- Modify: `apps/mobile/src/features/tasks/components/CustomerTaskDetail.tsx`

- [ ] **Step 1: Add imports (keep existing `useRouter`, add new ones)**

Add these imports alongside the existing ones (do NOT remove `useRouter`):
```typescript
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useBookings } from '../../bookings/hooks/useBookings';
import { useCompleteBooking } from '../../bookings/hooks/useCompleteBooking';
import { useReschedule } from '../../bookings/hooks/useReschedule';
import { RescheduleModal } from '../../bookings/components/RescheduleModal';
import { generateIdempotencyKey } from '../../../utils/uuid';
```

- [ ] **Step 2: Replace `DEMO_TASK` with real data fetch**

Remove the `DEMO_TASK` constant. Inside the component, add:
```typescript
const { id: taskId } = useLocalSearchParams<{ id: string }>();
const { data: bookingsData } = useBookings();
const booking = bookingsData?.data?.find(b => b.task_id === taskId);
const completeBooking = useCompleteBooking();
const rescheduleBooking = useReschedule();
const [showReschedule, setShowReschedule] = useState(false);
```

If `!booking`, render a loading skeleton or return early.

- [ ] **Step 3: Wire "Mark Complete" button**

Replace the static `LinearGradient` press handler with:
```typescript
onPress={async () => {
    if (!booking) return;
    await completeBooking.mutateAsync({
        bookingId: booking.id,
        idempotencyKey: generateIdempotencyKey(),
    });
    router.back();
}}
```

- [ ] **Step 4: Wire "Reschedule" button and RescheduleModal**

Change the "Reschedule Task" pressable to open the modal:
```typescript
<Pressable style={styles.secondaryAction} onPress={() => setShowReschedule(true)}>
    <Text style={styles.secondaryActionText}>{t('taskDetail.reschedule', 'Reschedule Task')}</Text>
</Pressable>
```

Add `RescheduleModal` at the end of the JSX, before the closing `</View>`:
```typescript
<RescheduleModal
    visible={showReschedule}
    onClose={() => setShowReschedule(false)}
    currentDate={booking?.confirmed_scheduled_at?.split('T')[0] ?? ''}
    currentTime={booking?.confirmed_scheduled_at?.split('T')[1]?.slice(0, 5) ?? ''}
    onSubmit={async ({ date, time, reason }) => {
        if (!booking) return;
        await rescheduleBooking.mutateAsync({
            bookingId: booking.id,
            proposed_scheduled_at: `${date}T${time}:00`,
            reason,
            idempotencyKey: generateIdempotencyKey(),
        });
        setShowReschedule(false);
    }}
/>
```

- [ ] **Step 5: Wire "Message Tasker" button**

```typescript
onPress={() => {
    // Navigate to chat with the booking's conversation
    if (booking?.task_id) {
        router.push(`/inbox/${booking.task_id}`);
    }
}}
- [ ] **Step 6: Add loading/error states**

Show skeleton when `!booking`, show error toast on mutation failure.

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/features/tasks/components/CustomerTaskDetail.tsx
git commit -m "feat(mobile): wire CustomerTaskDetail to booking API with complete, reschedule, and message"
```

---

### Task 7: Wire ApplicantsList to API

**Files:**
- Modify: `apps/mobile/src/features/tasks/components/ApplicantsList.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApplications } from '../hooks/useApplications';
import { useAcceptApplication } from '../../bookings/hooks/useAcceptApplication';
import { generateIdempotencyKey } from '../../../utils/uuid';
```

- [ ] **Step 2: Replace `MOCK_APPLICANTS` with real data**

Remove mock data. Inside component:
```typescript
const { id: taskId } = useLocalSearchParams<{ id: string }>();
const router = useRouter();
const { data, isLoading } = useApplications(taskId);
const acceptApplication = useAcceptApplication();
const applicants = data?.data ?? [];
```

- [ ] **Step 3: Wire accept button**

```typescript
onAccept={async (applicationId) => {
    await acceptApplication.mutateAsync({
        taskId,
        applicationId,
        liabilityDisclaimerAccepted: true,
        idempotencyKey: generateIdempotencyKey(),
    });
    router.back();
}}
```

- [ ] **Step 4: Wire "View Profile" navigation**

```typescript
onViewProfile={(userId) => router.push(`/profile/${userId}`)}
```

- [ ] **Step 5: Add loading skeleton state**

- [ ] **Step 6: Verify TypeScript compiles and commit**

```bash
git add apps/mobile/src/features/tasks/components/ApplicantsList.tsx
git commit -m "feat(mobile): wire ApplicantsList to applications API with accept"
```

---

### Task 8: Wire TaskerPublicProfile to API

**Files:**
- Modify: `apps/mobile/src/features/profile/components/TaskerPublicProfile.tsx`

- [ ] **Step 1: Add imports and `formatTimeAgo` utility**

```typescript
import { useLocalSearchParams } from 'expo-router';
import { useTaskerProfile } from '../hooks/useTaskerProfile';
```

Add a local helper at the top of the file (below imports):
```typescript
function formatTimeAgo(dateString: string): string {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    const diffWeek = Math.floor(diffDay / 7);
    return `${diffWeek}w ago`;
}
```

- [ ] **Step 2: Replace `DEMO_PROFILE` and `DEMO_REVIEWS` with real data**

Remove demo constants. Inside component:
```typescript
const { id: userId } = useLocalSearchParams<{ id: string }>();
const { profile: profileQuery, reviews: reviewsQuery } = useTaskerProfile(userId);
const profile = profileQuery.data;
const reviews = reviewsQuery.data?.data ?? [];
```

If `profileQuery.isLoading`, render a loading skeleton. If `!profile`, return early.

- [ ] **Step 3: Map API review data to ReviewCard props**

```typescript
{reviews.map((review, index) => (
    <ReviewCard
        key={review.id}
        reviewerInitials={review.reviewer_name?.slice(0, 2).toUpperCase() ?? '??'}
        reviewerName={review.reviewer_name ?? 'Anonymous'}
        rating={review.quality_rating ?? review.clarity_rating ?? 5}
        comment={review.comment ?? ''}
        timeAgo={formatTimeAgo(review.created_at)}
        featured={index === 0}
    />
))}
```

- [ ] **Step 4: Wire "Book a Session" CTA**

```typescript
onPress={() => router.push('/create')}
```

- [ ] **Step 5: Add loading skeleton and error states**

- [ ] **Step 6: Verify TypeScript compiles and commit**

```bash
git add apps/mobile/src/features/profile/components/TaskerPublicProfile.tsx
git commit -m "feat(mobile): wire TaskerPublicProfile to public profile and reviews API"
```

---

### Task 9: Final integration verification

- [ ] **Step 1: Full TypeScript check**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v __tests__ | grep "error TS"`
Expected: no errors

- [ ] **Step 2: Verify all screens import hooks (no remaining mock data)**

Run: `grep -r "DEMO_\|MOCK_" apps/mobile/src/features/ --include="*.tsx" -l`
Expected: only `NotificationCenter.tsx` (Phase 0 exception)

- [ ] **Step 3: Verify all routes resolve**

Run: `ls apps/mobile/src/app/task/\[id\].tsx apps/mobile/src/app/task/\[id\]/applicants.tsx apps/mobile/src/app/profile/\[id\].tsx`
Expected: all 3 files exist

- [ ] **Step 4: Commit any remaining fixes (explicit file paths only)**

```bash
git status apps/mobile/src/
# Review changed files, then add only the relevant ones:
git add apps/mobile/src/utils/uuid.ts apps/mobile/src/features/ apps/mobile/src/app/task/ apps/mobile/src/app/profile/ apps/mobile/src/lib/mobileApiClient.ts
git commit -m "feat(mobile): complete API wiring for all screens"
```

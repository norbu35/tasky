# Admin Panel Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the admin dev-login redirect, bring three scaffold pages up to design-system parity, and add three new phase-gated admin pages (Moderation, Payouts, Lead Pricing) with full API client wiring.

**Architecture:** Two-pass delivery — Pass 1 touches only existing files (bug fix + component swaps, no new API surface); Pass 2 adds new files and API client methods. Each pass is independently committable and testable. All pages follow the established admin page pattern: `useCallback`+`useEffect` for fetching, Card/Skeleton/Badge from the design system, `toast.success`/`toast.error` for mutation feedback.

**Tech Stack:** React 18, TypeScript, Vitest + React Testing Library, Tailwind CSS, Radix UI (via shadcn), lucide-react, react-router-dom v6, sonner (toasts)

---

## File Map

### Pass 1 — Modified files only
| File | Change |
|---|---|
| `apps/web/src/pages/AuthPage.tsx` | Role-aware redirect after dev login |
| `apps/web/src/pages/admin/AdminDisputesPage.tsx` | Design system polish |
| `apps/web/src/pages/admin/AdminDisputeDetailPage.tsx` | Design system polish |
| `apps/web/src/pages/admin/AdminConciergePage.tsx` | Design system polish |
| `apps/web/src/pages/admin/__tests__/AdminDisputesPage.test.tsx` | Update loading/empty state assertions |
| `apps/web/src/pages/admin/__tests__/AdminConciergePage.test.tsx` | Update loading/error/success state assertions |

### Pass 2 — New files + modifications
| File | Change |
|---|---|
| `apps/web/src/lib/apiClient.ts` | Add `PayoutRequest`, `LeadUnlockPrice`, `LeadUnlockPricePayload` types + 4 methods |
| `apps/web/src/pages/admin/AdminModerationPage.tsx` | New page |
| `apps/web/src/pages/admin/AdminPayoutsPage.tsx` | New page |
| `apps/web/src/pages/admin/AdminLeadPricingPage.tsx` | New page |
| `apps/web/src/pages/admin/__tests__/AdminModerationPage.test.tsx` | New test file |
| `apps/web/src/pages/admin/__tests__/AdminPayoutsPage.test.tsx` | New test file |
| `apps/web/src/pages/admin/__tests__/AdminLeadPricingPage.test.tsx` | New test file |
| `apps/web/src/pages/admin/index.ts` | Export 3 new pages |
| `apps/web/src/layout/AdminLayout.tsx` | Add 3 nav items |
| `apps/web/src/router/AppRoutes.tsx` | Add 3 routes + imports |

---

## PASS 1

---

### Task 1: Fix admin dev-login redirect

**Files:**
- Modify: `apps/web/src/pages/AuthPage.tsx`

- [ ] **Step 1: Locate the navigate call in `handleDevLogin`**

Open `apps/web/src/pages/AuthPage.tsx`. Find `handleDevLogin`. It currently ends with:
```ts
navigate(returnPath, { replace: true });
```

- [ ] **Step 2: Apply the role-aware redirect**

Replace that single line with:
```ts
const destination = role === 'ADMIN' ? '/admin/verifications' : returnPath;
navigate(destination, { replace: true });
```

The surrounding function context should look like:
```ts
const handleDevLogin = async (role: DevRole): Promise<void> => {
  setLoading(true);
  try {
    const devPhone =
      role === 'ADMIN' ? '+97600000000' : role === 'TASKER' ? '+97611111111' : '+97622222222';
    const session = await apiClient.devLogin(devPhone, role);
    setSession(session);
    setProfile(null);
    await refreshProfile();
    const destination = role === 'ADMIN' ? '/admin/verifications' : returnPath;
    navigate(destination, { replace: true });
  } catch (error) {
    toast.error(parseError(error));
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 3: Verify no other usages of `returnPath` need changing**

The `handleFacebookLogin` function also uses `navigate(returnPath, ...)`. Facebook login is for regular users — leave it unchanged.

- [ ] **Step 4: Run the web typecheck**

```bash
pnpm --filter @tasky/web typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/AuthPage.tsx
git commit -m "fix(web): redirect admin dev login to /admin/verifications

Ticket: TASK-admin-panel
Spec: REQ-ADMIN-01
API: no API change
Tests: manual verification via dev login
Risk: low"
```

---

### Task 2: Polish AdminDisputesPage

**Files:**
- Modify: `apps/web/src/pages/admin/AdminDisputesPage.tsx`
- Modify: `apps/web/src/pages/admin/__tests__/AdminDisputesPage.test.tsx`

- [ ] **Step 1: Update the test for loading state**

In `apps/web/src/pages/admin/__tests__/AdminDisputesPage.test.tsx`, find the test that asserts `screen.getByText(/loading/i)`. The polished page uses `<Skeleton>` instead of text — update that assertion:

```ts
// In the 'renders dispute list after load' test, remove:
expect(screen.getByText(/loading/i)).toBeInTheDocument();

// Skeletons don't have text; just wait for the loaded state directly.
// The test body becomes:
it('renders dispute list after load', async () => {
  const api = createMockApiClient();
  renderListPage(api);

  await waitFor(() => {
    expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
  });

  expect(screen.getByText(/Work quality was poor/)).toBeInTheDocument();
  expect(api.adminListDisputes).toHaveBeenCalledWith('test-token');
});
```

- [ ] **Step 2: Add a test for the Badge status column**

At the bottom of the `describe('AdminDisputesPage', ...)` block, add:

```ts
it('renders status badges for disputes', async () => {
  const api = createMockApiClient();
  renderListPage(api);

  await waitFor(() => {
    expect(screen.getByText(/Tasker did not show up/)).toBeInTheDocument();
  });

  // Both disputes have status OPEN
  const badges = screen.getAllByText('OPEN');
  expect(badges).toHaveLength(2);
});
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminDisputesPage
```

Expected: FAIL — "Unable to find an element with the text: OPEN" (badge not rendered yet).

- [ ] **Step 4: Rewrite AdminDisputesPage with design system components**

Replace the full content of `apps/web/src/pages/admin/AdminDisputesPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { Dispute } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

function disputeStatusVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'OPEN':
      return 'default';
    case 'RESOLVED_CUSTOMER':
    case 'RESOLVED_TASKER':
      return 'secondary';
    case 'ESCALATED':
    case 'CLOSED_INSUFFICIENT_EVIDENCE':
      return 'outline';
    default:
      return 'secondary';
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function AdminDisputesPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.adminListDisputes(session.accessToken);
      setDisputes(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiClient, session]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('admin.disputes.title', 'Disputes')}</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('admin.disputes.title', 'Disputes')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t('admin.disputes.error', 'Failed to load disputes')}
            </p>
            <Button onClick={fetchDisputes}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('admin.disputes.title', 'Disputes')}</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.disputes.empty', 'No disputes found.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('admin.disputes.title', 'Disputes')}</h1>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">
                {t('admin.disputes.reason', 'Reason')}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {t('admin.disputes.status', 'Status')}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {t('admin.disputes.createdAt', 'Created')}
              </th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr
                key={dispute.id}
                data-testid="dispute-row"
                className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
              >
                <td className="px-4 py-3">{truncate(dispute.reason, 80)}</td>
                <td className="px-4 py-3">
                  <Badge variant={disputeStatusVariant(dispute.status)}>{dispute.status}</Badge>
                </td>
                <td className="px-4 py-3">{formatDate(dispute.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminDisputesPage
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/AdminDisputesPage.tsx \
        apps/web/src/pages/admin/__tests__/AdminDisputesPage.test.tsx
git commit -m "refactor(web): polish AdminDisputesPage to design system standard

Ticket: TASK-admin-panel
Spec: REQ-ADMIN-02
API: no API change
Tests: updated unit tests
Risk: low"
```

---

### Task 3: Polish AdminDisputeDetailPage

**Files:**
- Modify: `apps/web/src/pages/admin/AdminDisputeDetailPage.tsx`

The existing tests for this page are in `AdminDisputesPage.test.tsx` (same file) and already pass against behavior, not visual structure. No test changes needed — just verify they still pass after the component swap.

- [ ] **Step 1: Run existing detail page tests before changing anything**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminDisputesPage
```

Expected: All PASS. Note the count (should be 11 tests total across list + detail).

- [ ] **Step 2: Rewrite AdminDisputeDetailPage with design system components**

Replace the full content of `apps/web/src/pages/admin/AdminDisputeDetailPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { AdminDisputeDetail, Dispute } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Textarea } from '../../components/ui/textarea';

function disputeStatusVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'OPEN':
      return 'default';
    case 'RESOLVED_CUSTOMER':
    case 'RESOLVED_TASKER':
      return 'secondary';
    case 'ESCALATED':
    case 'CLOSED_INSUFFICIENT_EVIDENCE':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function AdminDisputeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { apiClient, session } = useAppContext();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AdminDisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.adminGetDispute(session.accessToken, id);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiClient, session, id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleResolve = useCallback(
    async (resolution: 'RESOLVE_CUSTOMER' | 'RESOLVE_TASKER' | 'ESCALATE') => {
      if (!notes.trim()) {
        setValidationError(t('admin.disputeDetail.notesRequired', 'Notes are required.'));
        return;
      }
      setValidationError(null);
      if (!session || !id) return;
      setResolving(true);
      try {
        const idempotencyKey = crypto.randomUUID();
        await apiClient.adminResolveDispute(
          session.accessToken,
          id,
          resolution,
          notes.trim(),
          idempotencyKey,
        );
        navigate('/admin/disputes');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Resolution failed');
      } finally {
        setResolving(false);
      }
    },
    [apiClient, session, id, notes, navigate, t],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {t('admin.disputeDetail.title', 'Dispute Detail')}
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {t('admin.disputeDetail.title', 'Dispute Detail')}
        </h1>
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-destructive">
              {t('common.error', 'Error')}: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail) return null;

  const dispute = detail.dispute as unknown as Dispute;
  const booking = detail.booking as Record<string, unknown>;
  const task = booking.task as Record<string, unknown> | undefined;
  const customer = booking.customer as Record<string, unknown> | undefined;
  const tasker = booking.tasker as Record<string, unknown> | undefined;
  const evidenceMessages = detail.evidence_messages as Array<{
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/disputes')}>
          {t('common.back', 'Back')}
        </Button>
        <h1 className="text-2xl font-bold">
          {t('admin.disputeDetail.title', 'Dispute Detail')}
        </h1>
      </div>

      {/* Dispute Info */}
      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.disputeInfo', 'Dispute Info')}
          </h2>
          <p>
            <strong>{t('admin.disputeDetail.reason', 'Reason')}:</strong> {dispute.reason}
          </p>
          <div className="flex items-center gap-2">
            <strong>{t('admin.disputeDetail.status', 'Status')}:</strong>
            <Badge variant={disputeStatusVariant(dispute.status)}>{dispute.status}</Badge>
          </div>
          <p>
            <strong>{t('admin.disputeDetail.createdAt', 'Created')}:</strong>{' '}
            {new Date(dispute.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Booking Context */}
      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.bookingContext', 'Booking Context')}
          </h2>
          {task && (
            <>
              <p>
                <strong>{t('admin.disputeDetail.taskDescription', 'Task')}:</strong>{' '}
                {String(task.description ?? '')}
              </p>
              <p>
                <strong>{t('admin.disputeDetail.budget', 'Budget')}:</strong>{' '}
                {Number(task.budget ?? booking.price ?? 0).toLocaleString()}
              </p>
              {task.scheduled_at && (
                <p>
                  <strong>{t('admin.disputeDetail.schedule', 'Schedule')}:</strong>{' '}
                  {new Date(String(task.scheduled_at)).toLocaleString()}
                </p>
              )}
            </>
          )}
          {!task && booking.price !== undefined && (
            <p>
              <strong>{t('admin.disputeDetail.budget', 'Budget')}:</strong>{' '}
              {Number(booking.price).toLocaleString()}
            </p>
          )}
          {customer && (
            <p>
              <strong>{t('admin.disputeDetail.customer', 'Customer')}:</strong>{' '}
              {String(customer.full_name ?? 'Unknown')}
            </p>
          )}
          {tasker && (
            <p>
              <strong>{t('admin.disputeDetail.tasker', 'Tasker')}:</strong>{' '}
              {String(tasker.full_name ?? 'Unknown')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Evidence Messages */}
      {evidenceMessages.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">
              {t('admin.disputeDetail.evidence', 'Evidence Messages')}
            </h2>
            {evidenceMessages.map((msg) => (
              <div key={msg.id} className="border-l-2 border-border pl-3 py-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resolution */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">
            {t('admin.disputeDetail.resolution', 'Resolution')}
          </h2>
          <div>
            <label htmlFor="resolution-notes" className="block text-sm font-medium mb-1">
              {t('admin.disputeDetail.notesLabel', 'Resolution Notes')}
            </label>
            <Textarea
              id="resolution-notes"
              rows={4}
              placeholder={t(
                'admin.disputeDetail.notesPlaceholder',
                'Enter resolution notes...',
              )}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            {validationError && (
              <p className="text-destructive text-sm mt-1">{validationError}</p>
            )}
          </div>
          {error && detail && (
            <p className="text-destructive text-sm">
              {t('common.error', 'Error')}: {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              disabled={resolving}
              onClick={() => handleResolve('RESOLVE_CUSTOMER')}
            >
              {t('admin.disputeDetail.resolveCustomer', 'Resolve for Customer')}
            </Button>
            <Button
              disabled={resolving}
              onClick={() => handleResolve('RESOLVE_TASKER')}
            >
              {t('admin.disputeDetail.resolveTasker', 'Resolve for Tasker')}
            </Button>
            <Button
              variant="secondary"
              disabled={resolving}
              onClick={() => handleResolve('ESCALATE')}
            >
              {t('admin.disputeDetail.escalate', 'Escalate')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminDisputesPage
```

Expected: All PASS (same count as Step 1).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/AdminDisputeDetailPage.tsx
git commit -m "refactor(web): polish AdminDisputeDetailPage to design system standard

Ticket: TASK-admin-panel
Spec: REQ-ADMIN-02
API: no API change
Tests: existing unit tests pass
Risk: low"
```

---

### Task 4: Polish AdminConciergePage

**Files:**
- Modify: `apps/web/src/pages/admin/AdminConciergePage.tsx`
- Modify: `apps/web/src/pages/admin/__tests__/AdminConciergePage.test.tsx`

- [ ] **Step 1: Update the loading-state test**

In `apps/web/src/pages/admin/__tests__/AdminConciergePage.test.tsx`, the loading test checks `data-testid="concierge-loading"` and text `/loading/i`. After polish, the text is removed (replaced with Skeletons). Update:

```ts
// The existing test 'renders open tasks list' starts with loading.
// The loading state now shows Skeletons, not text — but the testid is preserved.
// No change needed to that specific assertion since it waits for loaded state.

// Update the error state test to use Card+Button:
it('shows error state when task loading fails', async () => {
  vi.mocked(mockApiClient.listTasks!).mockRejectedValue(new Error('Network error'));

  renderPage();

  await waitFor(() => {
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});
```

This test already passes (the error state already shows "failed to load" and a retry button). No change needed.

- [ ] **Step 2: Run existing concierge tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminConciergePage
```

Expected: All PASS. Note the count (9 tests).

- [ ] **Step 3: Rewrite AdminConciergePage with design system components**

Replace the full content of `apps/web/src/pages/admin/AdminConciergePage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import type { PublicTask, User, Booking } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';

type PageState = 'idle' | 'loading' | 'error' | 'ready' | 'assigning' | 'success' | 'assign-error';

export function AdminConciergePage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('idle');

  const [phoneQuery, setPhoneQuery] = useState('');
  const [taskerResults, setTaskerResults] = useState<User[]>([]);
  const [selectedTaskerId, setSelectedTaskerId] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [overrideReason, setOverrideReason] = useState('');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const accessToken = session?.accessToken ?? '';

  const loadTasks = useCallback(async () => {
    setPageState('loading');
    try {
      const result = await apiClient.listTasks(accessToken);
      setTasks(result.data.filter((task) => task.status === 'OPEN'));
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [apiClient, accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadTasks();
    }
  }, [accessToken, loadTasks]);

  const handleSearchTaskers = async () => {
    if (!phoneQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await apiClient.adminSearchUsers(accessToken, phoneQuery.trim());
      setTaskerResults(result.data.filter((user) => user.role === 'TASKER'));
    } catch {
      setTaskerResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const canAssign =
    selectedTaskId !== null &&
    selectedTaskerId !== null &&
    overrideReason.length >= 3 &&
    disclaimerChecked;

  const handleAssign = async () => {
    if (!canAssign || !selectedTaskId || !selectedTaskerId) return;
    setPageState('assigning');
    setAssignError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await apiClient.adminConciergeAssignTask(
        accessToken,
        selectedTaskId,
        selectedTaskerId,
        overrideReason,
        true,
        idempotencyKey,
      );
      setBooking(result);
      setPageState('success');
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Assignment failed');
      setPageState('assign-error');
    }
  };

  if (pageState === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {t('admin.concierge.title', 'Concierge Dispatch')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t('admin.concierge.loadError', 'Failed to load tasks.')}
            </p>
            <Button onClick={loadTasks}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'success' && booking) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {t('admin.concierge.title', 'Concierge Dispatch')}
        </h1>
        <Card>
          <CardContent className="p-6 space-y-2" data-testid="assignment-success">
            <h2 className="text-lg font-semibold">
              {t('admin.concierge.assignmentSuccess', 'Assignment Successful')}
            </h2>
            <p>
              {t('admin.concierge.bookingId', 'Booking ID')}: {booking.id}
            </p>
            <p>
              {t('admin.concierge.status', 'Status')}: {booking.status}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'loading' || pageState === 'idle') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {t('admin.concierge.title', 'Concierge Dispatch')}
        </h1>
        <div data-testid="concierge-loading" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {t('admin.concierge.title', 'Concierge Dispatch')}
      </h1>

      {/* Section 1: Open Tasks */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t('admin.concierge.selectTask', 'Select an Open Task')}
        </h2>
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              data-testid={`task-row-${task.id}`}
              data-selected={selectedTaskId === task.id ? 'true' : 'false'}
              className={`cursor-pointer transition-colors ${
                selectedTaskId === task.id
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedTaskId(task.id)}
            >
              <CardContent className="p-3">
                <p className="font-medium">{task.description}</p>
                <p className="text-sm text-muted-foreground">
                  {task.category.name} &middot; {task.budget.toLocaleString()}
                  {t('common.currency', ' MNT')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Find a Tasker */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t('admin.concierge.findTasker', 'Find a Tasker')}
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder={t('admin.concierge.phonePlaceholder', 'Phone number')}
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
          />
          <Button onClick={handleSearchTaskers} disabled={searchLoading}>
            {t('admin.concierge.search', 'Search')}
          </Button>
        </div>
        {taskerResults.length > 0 && (
          <div className="space-y-2">
            {taskerResults.map((user) => (
              <Card
                key={user.id}
                data-testid={`user-row-${user.id}`}
                data-selected={selectedTaskerId === user.id ? 'true' : 'false'}
                className={`cursor-pointer transition-colors ${
                  selectedTaskerId === user.id
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTaskerId(user.id)}
              >
                <CardContent className="p-3">
                  <p className="font-medium">{user.phone ?? user.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.role} &middot; {user.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Assignment Form */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t('admin.concierge.assignmentForm', 'Assignment')}
        </h2>
        <Input
          placeholder={t('admin.concierge.reasonPlaceholder', 'Override reason (min 3 chars)')}
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="concierge-disclaimer"
            checked={disclaimerChecked}
            onChange={(e) => setDisclaimerChecked(e.target.checked)}
          />
          <Label htmlFor="concierge-disclaimer">
            {t(
              'admin.concierge.disclaimerLabel',
              'I accept liability for this manual assignment',
            )}
          </Label>
        </div>

        {pageState === 'assign-error' && assignError && (
          <div data-testid="assignment-error" className="text-destructive text-sm">
            <p>{assignError}</p>
          </div>
        )}

        <Button
          onClick={handleAssign}
          disabled={!canAssign || pageState === 'assigning'}
        >
          {pageState === 'assigning'
            ? t('common.loading', 'Loading...')
            : t('admin.concierge.assign', 'Assign')}
        </Button>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminConciergePage
```

Expected: All PASS (same 9 tests).

- [ ] **Step 5: Run full admin test suite**

```bash
pnpm --filter @tasky/web test:unit -- --run src/pages/admin
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/AdminConciergePage.tsx \
        apps/web/src/pages/admin/__tests__/AdminConciergePage.test.tsx
git commit -m "refactor(web): polish AdminConciergePage to design system standard

Ticket: TASK-admin-panel
Spec: REQ-ADMIN-07
API: no API change
Tests: existing unit tests pass
Risk: low"
```

---

## PASS 2

---

### Task 5: Add API client types and methods for new pages

**Files:**
- Modify: `apps/web/src/lib/apiClient.ts`

- [ ] **Step 1: Add `PayoutRequest` and `LeadUnlockPrice` types**

In `apps/web/src/lib/apiClient.ts`, after the `StrikePolicyUpdateRequest` interface (around line 62), add:

```ts
export interface PayoutRequest {
  id: string;
  user_id?: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  created_at: string;
  processed_at: string | null;
}

export interface LeadUnlockPrice {
  id: string;
  category_id: string;
  district_id: string;
  credits_required: number;
  effective_from: string;
  effective_to: string | null;
}

export interface LeadUnlockPricePayload {
  category_id: string;
  district_id: string;
  credits_required: number;
  effective_from: string;
  effective_to?: string | null;
}
```

- [ ] **Step 2: Add method signatures to the `ApiClient` interface**

Find the `ApiClient` interface. After `adminUpdateStrikePolicy`, add:

```ts
adminListPendingPayouts(
  accessToken: string,
  cursor?: string,
  limit?: number,
): Promise<CursorPage<PayoutRequest>>;

adminProcessPayout(
  accessToken: string,
  id: string,
  idempotencyKey: string,
): Promise<PayoutRequest>;

adminListLeadUnlockPrices(
  accessToken: string,
  cursor?: string,
  limit?: number,
): Promise<CursorPage<LeadUnlockPrice>>;

adminCreateLeadUnlockPrice(
  accessToken: string,
  payload: LeadUnlockPricePayload,
): Promise<LeadUnlockPrice>;
```

- [ ] **Step 3: Add method implementations to `TaskyApiClient`**

Find the `adminUpdateStrikePolicy` implementation in the class body. After it, add:

```ts
adminListPendingPayouts(
  accessToken: string,
  cursor?: string,
  limit?: number,
): Promise<CursorPage<PayoutRequest>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return this.requestJson<CursorPage<PayoutRequest>>(
    `/admin/payouts/pending${query}`,
    { method: 'GET' },
    accessToken,
  );
}

adminProcessPayout(
  accessToken: string,
  id: string,
  idempotencyKey: string,
): Promise<PayoutRequest> {
  return this.requestJson<PayoutRequest>(
    `/admin/payouts/${id}/process`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    },
    accessToken,
  );
}

adminListLeadUnlockPrices(
  accessToken: string,
  cursor?: string,
  limit?: number,
): Promise<CursorPage<LeadUnlockPrice>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return this.requestJson<CursorPage<LeadUnlockPrice>>(
    `/admin/lead-unlock-prices${query}`,
    { method: 'GET' },
    accessToken,
  );
}

adminCreateLeadUnlockPrice(
  accessToken: string,
  payload: LeadUnlockPricePayload,
): Promise<LeadUnlockPrice> {
  return this.requestJson<LeadUnlockPrice>(
    '/admin/lead-unlock-prices',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}
```

- [ ] **Step 4: Verify the `requestJson` signature to confirm how `headers` is passed**

Look at another method that uses custom headers, e.g. `adminResolveDispute` which uses `Idempotency-Key`. Confirm the pattern used for passing extra headers is the same as above. (Check `adminConciergeAssignTask` or `adminResolveDispute` in the existing implementation for reference.)

- [ ] **Step 5: Run typecheck**

```bash
pnpm --filter @tasky/web typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/apiClient.ts
git commit -m "feat(web): add Payout and LeadUnlockPrice types + API client methods

Ticket: TASK-admin-panel
Spec: REQ-PAY-36, REQ-PAY-37
API: GET /admin/payouts/pending, POST /admin/payouts/{id}/process,
     GET /admin/lead-unlock-prices, POST /admin/lead-unlock-prices
Tests: typecheck
Risk: low"
```

---

### Task 6: Implement AdminModerationPage

**Files:**
- Create: `apps/web/src/pages/admin/AdminModerationPage.tsx`
- Create: `apps/web/src/pages/admin/__tests__/AdminModerationPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/pages/admin/__tests__/AdminModerationPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, StrikePolicy } from '../../../lib/apiClient';

const MOCK_POLICY: StrikePolicy = {
  strikeWindowDays: 28,
  strikeThreshold: 3,
  firstSuspensionDays: 7,
  repeatSuspensionDays: 30,
  repeatOffenseWindowDays: 90,
  autoUnsuspendEnabled: true,
  updatedAt: '2026-03-20T10:00:00Z',
};

const mockApiClient: Partial<ApiClient> = {
  adminGetStrikePolicy: vi.fn(),
  adminUpdateStrikePolicy: vi.fn(),
};

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: { accessToken: 'test-token', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } },
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
import { AdminModerationPage } from '../AdminModerationPage';

function renderPage() {
  return render(<AdminModerationPage />);
}

describe('AdminModerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.adminGetStrikePolicy!).mockResolvedValue(MOCK_POLICY);
    vi.mocked(mockApiClient.adminUpdateStrikePolicy!).mockResolvedValue({
      ...MOCK_POLICY,
      strikeThreshold: 2,
    });
  });

  it('fetches and displays current strike policy', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument(); // strikeWindowDays
    });

    expect(screen.getByText('3')).toBeInTheDocument(); // strikeThreshold
    expect(screen.getByText('7')).toBeInTheDocument(); // firstSuspensionDays
    expect(mockApiClient.adminGetStrikePolicy).toHaveBeenCalledWith('test-token');
  });

  it('shows loading skeleton before data loads', () => {
    vi.mocked(mockApiClient.adminGetStrikePolicy!).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByTestId('moderation-loading')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    vi.mocked(mockApiClient.adminGetStrikePolicy!).mockRejectedValue(new Error('Server error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clicking Edit switches fields to inputs', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Fields should now be inputs
    expect(screen.getByDisplayValue('28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('Cancel discards edits and returns to read-only', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const input = screen.getByDisplayValue('28');
    fireEvent.change(input, { target: { value: '14' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Back to read-only with original value
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('14')).not.toBeInTheDocument();
  });

  it('Save calls adminUpdateStrikePolicy and shows toast', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Change strikeThreshold from 3 to 2
    const thresholdInput = screen.getByDisplayValue('3');
    fireEvent.change(thresholdInput, { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockApiClient.adminUpdateStrikePolicy).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ strikeThreshold: 2 }),
      );
    });

    expect(toast.success).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminModerationPage
```

Expected: FAIL — "Cannot find module '../AdminModerationPage'".

- [ ] **Step 3: Implement AdminModerationPage**

Create `apps/web/src/pages/admin/AdminModerationPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import type { StrikePolicy, StrikePolicyUpdateRequest } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { Label } from '../../components/ui/label';

export function AdminModerationPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [policy, setPolicy] = useState<StrikePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StrikePolicyUpdateRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPolicy = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.adminGetStrikePolicy(session.accessToken);
      setPolicy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  }, [apiClient, session]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleEdit = () => {
    if (!policy) return;
    setDraft({
      strikeWindowDays: policy.strikeWindowDays,
      strikeThreshold: policy.strikeThreshold,
      firstSuspensionDays: policy.firstSuspensionDays,
      repeatSuspensionDays: policy.repeatSuspensionDays,
      repeatOffenseWindowDays: policy.repeatOffenseWindowDays,
      autoUnsuspendEnabled: policy.autoUnsuspendEnabled,
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(null);
  };

  const handleSave = async () => {
    if (!draft || !session) return;
    setSaving(true);
    try {
      const updated = await apiClient.adminUpdateStrikePolicy(session.accessToken, draft);
      setPolicy(updated);
      setEditing(false);
      setDraft(null);
      toast.success(t('admin.moderation.saved', 'Strike policy updated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6" />
          {t('admin.moderation.title', 'Moderation')}
        </h1>
        <Card data-testid="moderation-loading">
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6" />
          {t('admin.moderation.title', 'Moderation')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t('admin.moderation.loadError', 'Failed to load moderation policy')}
            </p>
            <Button onClick={fetchPolicy}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields: Array<{
    key: keyof StrikePolicyUpdateRequest;
    label: string;
    type: 'number' | 'boolean';
    min?: number;
    max?: number;
  }> = [
    { key: 'strikeWindowDays', label: t('admin.moderation.strikeWindowDays', 'Strike Window (days)'), type: 'number', min: 1, max: 365 },
    { key: 'strikeThreshold', label: t('admin.moderation.strikeThreshold', 'Strike Threshold'), type: 'number', min: 1, max: 10 },
    { key: 'firstSuspensionDays', label: t('admin.moderation.firstSuspensionDays', 'First Suspension (days)'), type: 'number', min: 1, max: 365 },
    { key: 'repeatSuspensionDays', label: t('admin.moderation.repeatSuspensionDays', 'Repeat Suspension (days)'), type: 'number', min: 1, max: 365 },
    { key: 'repeatOffenseWindowDays', label: t('admin.moderation.repeatOffenseWindowDays', 'Repeat Offense Window (days)'), type: 'number', min: 1, max: 730 },
    { key: 'autoUnsuspendEnabled', label: t('admin.moderation.autoUnsuspend', 'Auto-unsuspend'), type: 'boolean' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6" />
          {t('admin.moderation.title', 'Moderation')}
        </h1>
        {!editing && (
          <Button variant="outline" onClick={handleEdit}>
            {t('common.edit', 'Edit')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {fields.map(({ key, label, type, min, max }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium min-w-0 flex-1">{label}</Label>
              {editing && draft ? (
                type === 'boolean' ? (
                  <Switch
                    checked={draft[key] as boolean}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => prev && { ...prev, [key]: checked })
                    }
                  />
                ) : (
                  <Input
                    type="number"
                    className="w-28 text-right"
                    min={min}
                    max={max}
                    value={draft[key] as number}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev && { ...prev, [key]: parseInt(e.target.value, 10) || 0 },
                      )
                    }
                  />
                )
              ) : (
                <span className="text-sm font-mono">
                  {type === 'boolean'
                    ? (policy[key as keyof StrikePolicy] ? 'Yes' : 'No')
                    : String(policy[key as keyof StrikePolicy])}
                </span>
              )}
            </div>
          ))}

          {editing && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {t('common.save', 'Save')}
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2">
            {t('admin.moderation.updatedAt', 'Last updated')}:{' '}
            {new Date(policy.updatedAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminModerationPage
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/AdminModerationPage.tsx \
        apps/web/src/pages/admin/__tests__/AdminModerationPage.test.tsx
git commit -m "feat(web): add AdminModerationPage for strike policy management

Ticket: TASK-admin-panel
Spec: strike policy management
API: GET/PUT /admin/moderation/strike-policy
Tests: 6 unit tests
Risk: low"
```

---

### Task 7: Implement AdminPayoutsPage

**Files:**
- Create: `apps/web/src/pages/admin/AdminPayoutsPage.tsx`
- Create: `apps/web/src/pages/admin/__tests__/AdminPayoutsPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/pages/admin/__tests__/AdminPayoutsPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, PayoutRequest, CursorPage } from '../../../lib/apiClient';

const MOCK_PAYOUTS: CursorPage<PayoutRequest> = {
  data: [
    {
      id: 'payout-1',
      user_id: 'tasker-1',
      amount: 150000,
      bank_name: 'Хаан банк',
      bank_account: '5012345678',
      status: 'PENDING',
      created_at: '2026-03-25T10:00:00Z',
      processed_at: null,
    },
    {
      id: 'payout-2',
      user_id: 'tasker-2',
      amount: 80000,
      bank_name: 'Голомт банк',
      bank_account: '4098765432',
      status: 'PENDING',
      created_at: '2026-03-25T11:00:00Z',
      processed_at: null,
    },
  ],
  cursor: { next: null, prev: null },
};

const mockApiClient: Partial<ApiClient> = {
  adminListPendingPayouts: vi.fn(),
  adminProcessPayout: vi.fn(),
};

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: { accessToken: 'test-token', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } },
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'idem-key-1234') });

import { toast } from 'sonner';
import { AdminPayoutsPage } from '../AdminPayoutsPage';

function renderPage() {
  return render(<AdminPayoutsPage />);
}

describe('AdminPayoutsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockResolvedValue(MOCK_PAYOUTS);
    vi.mocked(mockApiClient.adminProcessPayout!).mockResolvedValue({
      ...MOCK_PAYOUTS.data[0],
      status: 'PROCESSED',
      processed_at: '2026-03-25T12:00:00Z',
    });
  });

  it('shows loading skeleton on mount', () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('payouts-loading')).toBeInTheDocument();
  });

  it('renders payout list after load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Хаан банк')).toBeInTheDocument();
    });

    expect(screen.getByText('Голомт банк')).toBeInTheDocument();
    expect(screen.getByText('150,000')).toBeInTheDocument();
    expect(mockApiClient.adminListPendingPayouts).toHaveBeenCalledWith('test-token');
  });

  it('shows empty state when no payouts', async () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockResolvedValue({
      data: [],
      cursor: { next: null, prev: null },
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no pending payouts/i)).toBeInTheDocument();
    });
  });

  it('shows phase-gate info card on 503', async () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { status: 503 }),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('payouts-phase-gated')).toBeInTheDocument();
    });
  });

  it('shows error state on non-503 failure', async () => {
    vi.mocked(mockApiClient.adminListPendingPayouts!).mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clicking Process opens confirmation dialog', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Хаан банк')).toBeInTheDocument();
    });

    const processButtons = screen.getAllByRole('button', { name: /process/i });
    fireEvent.click(processButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
  });

  it('confirming Process calls adminProcessPayout and removes row', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Хаан банк')).toBeInTheDocument();
    });

    const processButtons = screen.getAllByRole('button', { name: /process/i });
    fireEvent.click(processButtons[0]);

    // Confirm in dialog
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApiClient.adminProcessPayout).toHaveBeenCalledWith(
        'test-token',
        'payout-1',
        'idem-key-1234',
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    // Row should be removed
    await waitFor(() => {
      expect(screen.queryByText('Хаан банк')).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminPayoutsPage
```

Expected: FAIL — "Cannot find module '../AdminPayoutsPage'".

- [ ] **Step 3: Implement AdminPayoutsPage**

Create `apps/web/src/pages/admin/AdminPayoutsPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import type { PayoutRequest } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

type PageState = 'loading' | 'phase-gated' | 'error' | 'ready';

export function AdminPayoutsPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = useCallback(async () => {
    if (!session) return;
    setPageState('loading');
    setError(null);
    try {
      const result = await apiClient.adminListPendingPayouts(session.accessToken);
      setPayouts(result.data);
      setPageState('ready');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 503) {
        setPageState('phase-gated');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPageState('error');
      }
    }
  }, [apiClient, session]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleProcess = async () => {
    if (!confirmingId || !session) return;
    setProcessing(true);
    try {
      await apiClient.adminProcessPayout(session.accessToken, confirmingId, crypto.randomUUID());
      setPayouts((prev) => prev.filter((p) => p.id !== confirmingId));
      setConfirmingId(null);
      toast.success(t('admin.payouts.processed', 'Payout marked as processed'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process payout';
      if (message.includes('409') || (err as { status?: number }).status === 409) {
        toast.error(t('admin.payouts.offSchedule', 'Payouts can only be processed on Tuesdays and Fridays'));
      } else {
        toast.error(message);
      }
    } finally {
      setProcessing(false);
      setConfirmingId(null);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="h-6 w-6" />
          {t('admin.payouts.title', 'Payouts')}
        </h1>
        <div data-testid="payouts-loading" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (pageState === 'phase-gated') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="h-6 w-6" />
          {t('admin.payouts.title', 'Payouts')}
        </h1>
        <Card data-testid="payouts-phase-gated">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.payouts.phaseGated', 'Payouts are not active in the current phase.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="h-6 w-6" />
          {t('admin.payouts.title', 'Payouts')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t('admin.payouts.loadError', 'Failed to load pending payouts')}
            </p>
            <Button onClick={fetchPayouts}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Banknote className="h-6 w-6" />
        {t('admin.payouts.title', 'Payouts')}
      </h1>

      {payouts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.payouts.empty', 'No pending payouts.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colTasker', 'Tasker')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colBank', 'Bank')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colAmount', 'Amount (MNT)')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colRequested', 'Requested')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.payouts.colActions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr
                  key={payout.id}
                  data-testid={`payout-row-${payout.id}`}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {payout.user_id ?? '—'}
                  </td>
                  <td className="px-4 py-3">{payout.bank_name}</td>
                  <td className="px-4 py-3">{payout.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmingId(payout.id)}
                    >
                      {t('admin.payouts.process', 'Process')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={confirmingId !== null} onOpenChange={(open) => !open && setConfirmingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.payouts.confirmTitle', 'Confirm Payout Processing')}</DialogTitle>
            <DialogDescription>
              {t(
                'admin.payouts.confirmDesc',
                'This will mark the payout as processed. This action cannot be undone and assumes you have completed the bank transfer.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmingId(null)}
              disabled={processing}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {t('common.confirm', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminPayoutsPage
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/AdminPayoutsPage.tsx \
        apps/web/src/pages/admin/__tests__/AdminPayoutsPage.test.tsx
git commit -m "feat(web): add AdminPayoutsPage for pending payout management

Ticket: TASK-admin-panel
Spec: REQ-PAY-36, REQ-PAY-37
API: GET /admin/payouts/pending, POST /admin/payouts/{id}/process
Tests: 7 unit tests
Risk: low"
```

---

### Task 8: Implement AdminLeadPricingPage

**Files:**
- Create: `apps/web/src/pages/admin/AdminLeadPricingPage.tsx`
- Create: `apps/web/src/pages/admin/__tests__/AdminLeadPricingPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/pages/admin/__tests__/AdminLeadPricingPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient, LeadUnlockPrice, CursorPage } from '../../../lib/apiClient';

const MOCK_PRICES: CursorPage<LeadUnlockPrice> = {
  data: [
    {
      id: 'price-1',
      category_id: 'cat-cleaning',
      district_id: 'khan-uul',
      credits_required: 5,
      effective_from: '2026-03-01T00:00:00Z',
      effective_to: null,
    },
    {
      id: 'price-2',
      category_id: 'cat-moving',
      district_id: 'bayangol',
      credits_required: 8,
      effective_from: '2026-03-15T00:00:00Z',
      effective_to: '2026-06-01T00:00:00Z',
    },
  ],
  cursor: { next: null, prev: null },
};

const mockApiClient: Partial<ApiClient> = {
  adminListLeadUnlockPrices: vi.fn(),
  adminCreateLeadUnlockPrice: vi.fn(),
};

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    apiClient: mockApiClient,
    session: { accessToken: 'test-token', refreshToken: 'rt', user: { id: '1', role: 'ADMIN' } },
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
import { AdminLeadPricingPage } from '../AdminLeadPricingPage';

function renderPage() {
  return render(<AdminLeadPricingPage />);
}

describe('AdminLeadPricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockResolvedValue(MOCK_PRICES);
    vi.mocked(mockApiClient.adminCreateLeadUnlockPrice!).mockResolvedValue({
      id: 'price-3',
      category_id: 'cat-repair',
      district_id: 'sukhbaatar',
      credits_required: 3,
      effective_from: '2026-04-01T00:00:00Z',
      effective_to: null,
    });
  });

  it('shows loading skeleton on mount', () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('pricing-loading')).toBeInTheDocument();
  });

  it('renders price list after load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('cat-cleaning')).toBeInTheDocument();
    });

    expect(screen.getByText('khan-uul')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('cat-moving')).toBeInTheDocument();
    expect(mockApiClient.adminListLeadUnlockPrices).toHaveBeenCalledWith('test-token');
  });

  it('shows empty state when no prices', async () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockResolvedValue({
      data: [],
      cursor: { next: null, prev: null },
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no prices/i)).toBeInTheDocument();
    });
  });

  it('shows phase-gate info card on 503', async () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { status: 503 }),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('pricing-phase-gated')).toBeInTheDocument();
    });
  });

  it('shows error state on non-503 failure', async () => {
    vi.mocked(mockApiClient.adminListLeadUnlockPrices!).mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Create Price button opens dialog', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('cat-cleaning')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create price/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('submitting the create form calls adminCreateLeadUnlockPrice', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('cat-cleaning')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create price/i }));

    fireEvent.change(screen.getByPlaceholderText(/category/i), {
      target: { value: 'cat-repair' },
    });
    fireEvent.change(screen.getByPlaceholderText(/district/i), {
      target: { value: 'sukhbaatar' },
    });
    fireEvent.change(screen.getByPlaceholderText(/credits/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText(/effective from/i), {
      target: { value: '2026-04-01T00:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockApiClient.adminCreateLeadUnlockPrice).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          category_id: 'cat-repair',
          district_id: 'sukhbaatar',
          credits_required: 3,
        }),
      );
    });

    expect(toast.success).toHaveBeenCalled();

    // New price should appear in the table
    await waitFor(() => {
      expect(screen.getByText('cat-repair')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminLeadPricingPage
```

Expected: FAIL — "Cannot find module '../AdminLeadPricingPage'".

- [ ] **Step 3: Implement AdminLeadPricingPage**

Create `apps/web/src/pages/admin/AdminLeadPricingPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import type { LeadUnlockPrice, LeadUnlockPricePayload } from '../../lib/apiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

type PageState = 'loading' | 'phase-gated' | 'error' | 'ready';

const EMPTY_FORM: LeadUnlockPricePayload = {
  category_id: '',
  district_id: '',
  credits_required: 1,
  effective_from: '',
  effective_to: null,
};

export function AdminLeadPricingPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const [prices, setPrices] = useState<LeadUnlockPrice[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<LeadUnlockPricePayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchPrices = useCallback(async () => {
    if (!session) return;
    setPageState('loading');
    setError(null);
    try {
      const result = await apiClient.adminListLeadUnlockPrices(session.accessToken);
      setPrices(result.data);
      setPageState('ready');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 503) {
        setPageState('phase-gated');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPageState('error');
      }
    }
  }, [apiClient, session]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleOpenDialog = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const payload: LeadUnlockPricePayload = {
        ...form,
        effective_to: form.effective_to || null,
      };
      const created = await apiClient.adminCreateLeadUnlockPrice(session.accessToken, payload);
      setPrices((prev) => [created, ...prev]);
      setDialogOpen(false);
      toast.success(t('admin.pricing.created', 'Price rule created'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create price');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <div data-testid="pricing-loading" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (pageState === 'phase-gated') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <Card data-testid="pricing-phase-gated">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t(
                'admin.pricing.phaseGated',
                'Lead pricing is not active in the current phase.',
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-destructive">
              {t('admin.pricing.loadError', 'Failed to load lead unlock prices')}
            </p>
            <Button onClick={fetchPrices}>{t('common.retry', 'Retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          {t('admin.pricing.title', 'Lead Pricing')}
        </h1>
        <Button onClick={handleOpenDialog}>
          {t('admin.pricing.create', 'Create Price')}
        </Button>
      </div>

      {prices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('admin.pricing.empty', 'No prices configured.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colCategory', 'Category')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colDistrict', 'District')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colCredits', 'Credits')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colFrom', 'Effective From')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.pricing.colTo', 'Effective To')}
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr
                  key={price.id}
                  data-testid={`price-row-${price.id}`}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs">{price.category_id}</td>
                  <td className="px-4 py-3">{price.district_id}</td>
                  <td className="px-4 py-3">{price.credits_required}</td>
                  <td className="px-4 py-3">
                    {new Date(price.effective_from).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {price.effective_to
                      ? new Date(price.effective_to).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pricing.createTitle', 'Create Price Rule')}</DialogTitle>
            <DialogDescription>
              {t(
                'admin.pricing.createDesc',
                'Set a lead unlock credit requirement for a category and district.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="price-category">{t('admin.pricing.colCategory', 'Category ID')}</Label>
              <Input
                id="price-category"
                placeholder={t('admin.pricing.categoryPlaceholder', 'Category UUID')}
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-district">{t('admin.pricing.colDistrict', 'District ID')}</Label>
              <Input
                id="price-district"
                placeholder={t('admin.pricing.districtPlaceholder', 'District slug')}
                value={form.district_id}
                onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-credits">{t('admin.pricing.colCredits', 'Credits Required')}</Label>
              <Input
                id="price-credits"
                type="number"
                min={1}
                placeholder={t('admin.pricing.creditsPlaceholder', 'Credits (min 1)')}
                value={form.credits_required}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    credits_required: parseInt(e.target.value, 10) || 1,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-from">{t('admin.pricing.colFrom', 'Effective From')}</Label>
              <Input
                id="price-from"
                type="datetime-local"
                placeholder={t('admin.pricing.fromPlaceholder', 'Effective from date')}
                value={form.effective_from}
                onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-to">
                {t('admin.pricing.colTo', 'Effective To')} ({t('common.optional', 'optional')})
              </Label>
              <Input
                id="price-to"
                type="datetime-local"
                placeholder={t('admin.pricing.toPlaceholder', 'Effective to date (optional)')}
                value={form.effective_to ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, effective_to: e.target.value || null }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @tasky/web test:unit -- --run AdminLeadPricingPage
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/AdminLeadPricingPage.tsx \
        apps/web/src/pages/admin/__tests__/AdminLeadPricingPage.test.tsx
git commit -m "feat(web): add AdminLeadPricingPage for lead unlock price management

Ticket: TASK-admin-panel
Spec: REQ-PAY-17, REQ-PAY-24
API: GET/POST /admin/lead-unlock-prices
Tests: 7 unit tests
Risk: low"
```

---

### Task 9: Wire navigation, routing, and exports

**Files:**
- Modify: `apps/web/src/pages/admin/index.ts`
- Modify: `apps/web/src/layout/AdminLayout.tsx`
- Modify: `apps/web/src/router/AppRoutes.tsx`

- [ ] **Step 1: Add exports to `pages/admin/index.ts`**

Append to `apps/web/src/pages/admin/index.ts`:

```ts
export { AdminModerationPage } from './AdminModerationPage';
export { AdminPayoutsPage } from './AdminPayoutsPage';
export { AdminLeadPricingPage } from './AdminLeadPricingPage';
```

The file should now have 10 export lines total.

- [ ] **Step 2: Add nav items to AdminLayout**

In `apps/web/src/layout/AdminLayout.tsx`:

Add `Scale`, `Banknote`, `Tag` to the lucide-react import:
```ts
import { ShieldCheck, AlertTriangle, Users, FolderTree, ToggleLeft, Headset, Scale, Banknote, Tag } from 'lucide-react';
```

Add three entries to the end of `NAV_ITEMS`:
```ts
{ to: '/admin/moderation', icon: Scale,    label: 'admin.nav.moderation', fallback: 'Moderation' },
{ to: '/admin/payouts',    icon: Banknote, label: 'admin.nav.payouts',    fallback: 'Payouts'    },
{ to: '/admin/pricing',    icon: Tag,      label: 'admin.nav.pricing',    fallback: 'Pricing'    },
```

- [ ] **Step 3: Add routes and imports to AppRoutes**

In `apps/web/src/router/AppRoutes.tsx`:

Update the destructured import from `'../pages/admin'` to include the three new pages:
```ts
import {
  AdminVerificationsPage,
  AdminDisputesPage,
  AdminDisputeDetailPage,
  AdminUsersPage,
  AdminCategoriesPage,
  AdminFeaturesPage,
  AdminConciergePage,
  AdminModerationPage,
  AdminPayoutsPage,
  AdminLeadPricingPage,
} from '../pages/admin';
```

Add three routes inside the `path="/admin"` `<Route>` block, after the existing `concierge` route:
```tsx
<Route path="moderation" element={<AdminModerationPage />} />
<Route path="payouts"    element={<AdminPayoutsPage />} />
<Route path="pricing"    element={<AdminLeadPricingPage />} />
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm --filter @tasky/web typecheck
```

Expected: No errors.

- [ ] **Step 5: Run full admin test suite**

```bash
pnpm --filter @tasky/web test:unit -- --run src/pages/admin
```

Expected: All PASS across all admin test files.

- [ ] **Step 6: Run lint**

```bash
pnpm --filter @tasky/web lint
```

Expected: No errors or warnings.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/admin/index.ts \
        apps/web/src/layout/AdminLayout.tsx \
        apps/web/src/router/AppRoutes.tsx
git commit -m "feat(web): wire Moderation, Payouts, Pricing pages to admin nav and router

Ticket: TASK-admin-panel
Spec: REQ-ADMIN-05, REQ-PAY-36
API: no API change
Tests: typecheck + full admin suite
Risk: low"
```

---

## Self-Review

**Spec coverage check:**
| Spec section | Task |
|---|---|
| §2 Bug fix: ADMIN redirect | Task 1 |
| §3.1 AdminDisputesPage polish | Task 2 |
| §3.2 AdminDisputeDetailPage polish | Task 3 |
| §3.3 AdminConciergePage polish | Task 4 |
| §4.1 AdminModerationPage | Task 6 |
| §4.2 AdminPayoutsPage | Task 7 |
| §4.3 AdminLeadPricingPage | Task 8 |
| §4 apiClient additions | Task 5 |
| §5 Nav + routing | Task 9 |

All spec sections covered. ✅

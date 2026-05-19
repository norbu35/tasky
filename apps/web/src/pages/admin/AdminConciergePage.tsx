import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppContext } from '../../context/AppContext';
import { useAdminApiClient } from '../../lib/adminApiClient';
import type { TaskFeedItem, User, Booking } from '../../lib/apiClient';

type PageState = 'idle' | 'loading' | 'error' | 'ready' | 'assigning' | 'success' | 'assign-error';

export function AdminConciergePage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();
  const adminApiClient = useAdminApiClient();

  const [tasks, setTasks] = useState<TaskFeedItem[]>([]);
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
  }, [accessToken, apiClient]);

  useEffect(() => {
    if (accessToken) {
      loadTasks();
    }
  }, [accessToken, loadTasks]);

  const handleSearchTaskers = async () => {
    if (!phoneQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await adminApiClient.adminSearchUsers(accessToken, phoneQuery.trim());
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
      const result = await adminApiClient.adminConciergeAssignTask(
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
      setAssignError(err instanceof Error ? err.message : t('admin.concierge.assignmentFailed'));
      setPageState('assign-error');
    }
  };

  if (pageState === 'error') {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.concierge.title')}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-body-sm text-destructive">{t('admin.concierge.loadError')}</p>
            <Button variant="outline" size="sm" onClick={loadTasks}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'success' && booking) {
    return (
      <div className="space-y-6" data-testid="assignment-success">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.concierge.title')}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-section-heading">
              {t('admin.concierge.assignmentSuccess')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                {t('admin.concierge.bookingId')}:
              </span>
              <span className="text-body-sm font-semibold">{booking.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-badge-text font-medium uppercase tracking-caps text-muted-foreground">
                {t('admin.concierge.status')}:
              </span>
              <Badge variant="statusAssigned" className="uppercase tracking-caps">
                {booking.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'loading' || pageState === 'idle') {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('admin.concierge.title')}
        </h1>
        <div data-testid="concierge-loading" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {t('admin.concierge.title')}
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold font-display">{t('admin.concierge.selectTask')}</h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card
              key={task.id}
              data-testid={`task-row-${task.id}`}
              data-selected={selectedTaskId === task.id ? 'true' : 'false'}
              className={`cursor-pointer transition-all duration-200 ${
                selectedTaskId === task.id
                  ? 'ring-2 ring-inset ring-primary shadow-deep'
                  : 'hover:shadow-elevated'
              }`}
              onClick={() => setSelectedTaskId(task.id)}
            >
              <CardContent className="p-4">
                <p className="text-body-sm font-medium">{task.description}</p>
                <p className="text-badge-text text-muted-foreground mt-1">
                  {task.category.name} &middot; {(task.budget ?? 0).toLocaleString()}
                  {t('common.currency')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold font-display">{t('admin.concierge.findTasker')}</h2>
        <div className="flex gap-2">
          <Input
            placeholder={t('admin.concierge.phonePlaceholder')}
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
          />
          <Button onClick={handleSearchTaskers} disabled={searchLoading}>
            {t('admin.concierge.search')}
          </Button>
        </div>
        {taskerResults.length > 0 && (
          <div className="space-y-3">
            {taskerResults.map((user) => (
              <Card
                key={user.id}
                data-testid={`user-row-${user.id}`}
                data-selected={selectedTaskerId === user.id ? 'true' : 'false'}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedTaskerId === user.id
                    ? 'ring-2 ring-inset ring-primary shadow-deep'
                    : 'hover:shadow-elevated'
                }`}
                onClick={() => setSelectedTaskerId(user.id)}
              >
                <CardContent className="p-4">
                  <p className="text-body-sm font-medium">{user.phone ?? user.id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-badge-text uppercase tracking-caps">
                      {user.role}
                    </Badge>
                    <span className="text-badge-text text-muted-foreground">{user.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold font-display">
          {t('admin.concierge.assignmentForm')}
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder={t('admin.concierge.reasonPlaceholder')}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="concierge-disclaimer"
                checked={disclaimerChecked}
                onChange={(e) => setDisclaimerChecked(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="concierge-disclaimer" className="text-body-sm">
                {t('admin.concierge.disclaimerLabel')}
              </Label>
            </div>

            {pageState === 'assign-error' && assignError && (
              <div
                data-testid="assignment-error"
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
              >
                <p className="text-body-sm text-destructive">{assignError}</p>
              </div>
            )}

            <Button onClick={handleAssign} disabled={!canAssign || pageState === 'assigning'}>
              {pageState === 'assigning' ? t('common.loading') : t('admin.concierge.assign')}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

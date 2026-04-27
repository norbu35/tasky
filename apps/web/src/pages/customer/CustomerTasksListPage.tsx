import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveFeedShell, StatePanel } from '../../layout/parity';
import type { Task } from '../../lib/apiClient';

const TASK_STATUS_LABEL_KEYS: Readonly<Record<string, string>> = {
  OPEN: 'sharedPages.status.OPEN',
  ASSIGNED: 'sharedPages.status.ASSIGNED',
  COMPLETED: 'sharedPages.status.COMPLETED',
  CANCELLED: 'sharedPages.status.CANCELLED',
  NO_SHOW: 'sharedPages.status.NO_SHOW',
  PENDING: 'sharedPages.status.PENDING',
  UNKNOWN: 'sharedPages.status.UNKNOWN',
};

function getTaskStatusLabelKey(status: string): string {
  return TASK_STATUS_LABEL_KEYS[status] ?? 'sharedPages.status.UNKNOWN';
}

export function CustomerTasksListPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: tasksPage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customerTasksList', session, apiClient],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      return apiClient.listMyTasks(session.accessToken);
    },
    enabled: Boolean(session),
  });

  const tasks = tasksPage?.data ?? [];

  return (
    <ResponsiveFeedShell
      title={t('customerPages.tasksList.title')}
      description={t('customerPages.tasksList.description')}
      primaryAction={
        <Button type="button" onClick={() => navigate('/customer/tasks/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('customerPages.tasksList.postNew')}
        </Button>
      }
      sideRail={
        <StatePanel
          title={t('customerPages.tasksList.freshRequest')}
          description={t('customerPages.tasksList.startNewDesc')}
          tone="muted"
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/customer/tasks/new')}
            >
              {t('customerPages.tasksList.startPosting')}
            </Button>
          }
        />
      }
    >
      {error ? (
        <StatePanel
          title={t('customerPages.tasksList.errorTitle')}
          description={
            error instanceof Error ? error.message : t('customerPages.tasksList.tryAgain')
          }
          tone="destructive"
        />
      ) : isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-border/60 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <StatePanel
          title={t('customerPages.tasksList.noTasks')}
          description={t('customerPages.tasksList.postFirst')}
          actions={
            <Button type="button" onClick={() => navigate('/customer/tasks/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('customerPages.tasksList.postNew')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => navigate(`/customer/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </ResponsiveFeedShell>
  );
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { t } = useTranslation();

  return (
    <Card
      className="border-border/60 shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/20"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={task.status === 'OPEN' ? 'default' : 'secondary'}>
              {t(getTaskStatusLabelKey(task.status))}
            </Badge>
            <span className="text-xs uppercase tracking-caps text-muted-foreground">
              {t('customerPages.tasksList.cardType')}
            </span>
          </div>
          <h2 className="truncate text-base font-semibold">{task.description}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {task.location_text}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(task.scheduled_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold font-display">
            {task.budget != null && (
              <>
                {task.budget.toLocaleString()} {t('sharedPages.currencyMNT')}
              </>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onOpen}>
            {t('customerPages.tasksList.viewDetails')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

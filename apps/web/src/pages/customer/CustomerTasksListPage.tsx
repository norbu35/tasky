import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Plus } from 'lucide-react';

import { ResponsiveFeedShell, StatePanel } from '../../components/parity';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppContext } from '../../context/AppContext';
import type { Task } from '../../lib/apiClient';

export function CustomerTasksListPage() {
  const { apiClient, session } = useAppContext();
  const navigate = useNavigate();

  const {
    data: tasksPage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customerTasksList', session?.accessToken],
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
      title="My tasks"
      description="Track what you have posted and jump back into the posting flow."
      primaryAction={
        <Button type="button" onClick={() => navigate('/customer/tasks/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Post new task
        </Button>
      }
      sideRail={
        <StatePanel
          title="Need a fresh request?"
          description="Start a new customer task from the same posting flow."
          tone="muted"
          actions={
            <Button type="button" variant="secondary" onClick={() => navigate('/customer/tasks/new')}>
              Start posting
            </Button>
          }
        />
      }
    >
      {error ? (
        <StatePanel
          title="Failed to load tasks"
          description={error instanceof Error ? error.message : 'Please try again.'}
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
          title="No tasks yet"
          description="Post your first task to start collecting applications."
          actions={
            <Button type="button" onClick={() => navigate('/customer/tasks/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Post new task
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={() => navigate(`/customer/tasks/${task.id}`)} />
          ))}
        </div>
      )}
    </ResponsiveFeedShell>
  );
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
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
            <Badge variant={task.status === 'OPEN' ? 'default' : 'secondary'}>{task.status}</Badge>
            <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Customer task
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
          <div className="text-lg font-semibold">{task.budget.toLocaleString()} MNT</div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onOpen}>
            View details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

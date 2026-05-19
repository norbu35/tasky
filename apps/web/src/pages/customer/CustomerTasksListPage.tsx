import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { TaskCard } from '../../components/feature/TaskCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveFeedShell, StatePanel } from '../../layout/parity';

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
      sideRail={undefined}
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
            <Card key={index}>
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
              variant="list"
              onOpen={() => navigate(`/customer/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </ResponsiveFeedShell>
  );
}

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { TaskCard } from '../components/feature/TaskCard';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import { formatFullDate } from '../lib/formatDate';

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
          <CardFooter className="px-4 py-3">
            <Skeleton className="h-3 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function CustomerDashboardPage() {
  const { apiClient, session, profile } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: tasksPage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customerTasks', session, apiClient],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      return apiClient.listMyTasks(session.accessToken);
    },
    enabled: !!session,
  });

  const openTasks = tasksPage?.data?.filter((task) => task.status === 'OPEN') ?? [];
  const activeTasks = tasksPage?.data?.filter((task) => task.status === 'ASSIGNED') ?? [];
  const pastTasks =
    tasksPage?.data?.filter(
      (task) =>
        task.status === 'COMPLETED' || task.status === 'CANCELLED' || task.status === 'NO_SHOW',
    ) ?? [];

  return (
    <ScreenFrame maxWidth="wide">
      <div className="flex flex-col gap-8">
        {/* Greeting header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-caption font-sans font-medium uppercase tracking-caps text-muted-foreground">
              {formatFullDate(new Date())}
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {t('customerDashboard.greeting')},{' '}
              <span className="text-primary">
                {profile?.full_name?.split(' ')[0] ?? t('customerDashboard.friend')}
              </span>
              {'!'}
            </h1>
            <p className="text-body text-text-secondary">
              {isLoading
                ? t('customerDashboard.loadingTasks')
                : t('customerDashboard.activeTasksToday', {
                    count: openTasks.length + activeTasks.length,
                  })}
            </p>
          </div>
          {tasksPage?.data && tasksPage.data.length > 0 && (
            <Button
              aria-label={t('customerDashboard.postNewTask')}
              onClick={() => navigate('/customer/tasks/new')}
              className="gap-2 flex-shrink-0 shadow-fab"
            >
              <Plus className="w-icon-sm h-icon-sm" />
              <span className="hidden sm:inline">{t('customerDashboard.postNewTask')}</span>
            </Button>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('customerDashboard.errorTitle')}</AlertTitle>
            <AlertDescription>
              {error.message ?? t('customerDashboard.errorFailedLoad')}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <DashboardSkeleton />
        ) : !tasksPage?.data || tasksPage.data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed bg-muted/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-5">
              <Plus className="w-icon-sm h-icon-sm text-primary" />
            </div>
            <p className="text-section-heading font-display font-semibold text-foreground mb-2">
              {t('customerDashboard.noTasksTitle')}
            </p>
            <p className="text-body-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
              {t('customerDashboard.noTasksDesc')}
            </p>
            <Button onClick={() => navigate('/customer/tasks/new')} className="shadow-fab">
              {t('customerDashboard.postFirstTask')}
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="open">{t('customerDashboard.tabOpen')}</TabsTrigger>
              <TabsTrigger value="active">{t('customerDashboard.tabActive')}</TabsTrigger>
              <TabsTrigger value="past">{t('customerDashboard.tabPast')}</TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {openTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => navigate(`/customer/tasks/${task.id}`)}
                  />
                ))}
                {openTasks.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-body text-muted-foreground">
                      {t('customerDashboard.emptyOpen')}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => navigate(`/customer/tasks/${task.id}`)}
                  />
                ))}
                {activeTasks.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-body text-muted-foreground">
                      {t('customerDashboard.emptyActive')}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="past">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => navigate(`/customer/tasks/${task.id}`)}
                  />
                ))}
                {pastTasks.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-body text-muted-foreground">
                      {t('customerDashboard.emptyPast')}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ScreenFrame>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, Clock, MapPin, Star, Trash2, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import type { TaskApplication } from '../lib/apiClient';
import { formatDate, formatTime, formatRelativeTime } from '../lib/formatDate';

const STATUS_BADGE_VARIANT: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  OPEN: 'statusOpen',
  ASSIGNED: 'statusAssigned',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
  NO_SHOW: 'noShow',
};

export function CustomerTaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { apiClient, session } = useAppContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tasksPage, isLoading: tasksLoading } = useQuery({
    queryKey: ['customerTasks', session, apiClient],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      return apiClient.listMyTasks(session.accessToken);
    },
    enabled: !!session && !!taskId,
  });

  // In a real app we'd fetch the task specifically by ID if listMyTasks didn't have it,
  // but here we just find it from the list for simplicity since it's the customer's own task.
  const task = tasksPage?.data.find((t) => t.id === taskId);

  const {
    data: applicationsPage,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery({
    queryKey: ['taskApplications', taskId, session, apiClient],
    queryFn: async () => {
      if (!session || !taskId) throw new Error('Missing requirements');
      return apiClient.listTaskApplications(session.accessToken, taskId);
    },
    enabled: !!session && !!taskId && !!task,
  });

  const isAssigned = task?.status === 'ASSIGNED' || task?.status === 'COMPLETED';
  const isOpen = task?.status === 'OPEN';

  const cancelTaskMutation = useMutation({
    mutationFn: async () => {
      if (!session || !taskId) throw new Error('Missing requirements');
      return apiClient.cancelTask(session.accessToken, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTasks'] });
      navigate('/customer/tasks');
    },
  });

  if (tasksLoading) {
    return (
      <ScreenFrame>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-1/3" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-2/5" />
              <Skeleton className="h-4 w-3/5" />
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-28" />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </ScreenFrame>
    );
  }

  if (!task) {
    return (
      <ScreenFrame>
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTitle>{t('customerTaskDetails.notFoundTitle')}</AlertTitle>
            <AlertDescription>{t('customerTaskDetails.notFoundDesc')}</AlertDescription>
          </Alert>
          <Button variant="ghost" onClick={() => navigate('/customer/tasks')}>
            <ChevronLeft className="w-icon-sm h-icon-sm mr-1" />
            {t('customerTaskDetails.backToMyTasks')}
          </Button>
        </div>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame maxWidth="wide">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/tasks')}
            className="h-9 w-9 p-0 rounded-lg"
          >
            <ChevronLeft className="w-icon-sm h-icon-sm" />
          </Button>
          <h1 className="font-display text-3xl font-semibold tracking-tight truncate">
            {task.category
              ? i18n.language === 'mn'
                ? task.category.name_mn
                : task.category.name
              : t('common.unknown')}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="lg:w-3/5">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="text-body text-foreground whitespace-pre-wrap leading-relaxed">
                      {task.description}
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                      <MapPin className="w-icon-sm h-icon-sm" />
                      {task.location_text}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={STATUS_BADGE_VARIANT[task.status] ?? 'default'}
                      className="text-badge-text"
                    >
                      {task.status}
                    </Badge>
                    {isOpen && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancelTaskMutation.mutate()}
                        disabled={cancelTaskMutation.isPending}
                      >
                        <Trash2 className="mr-1 w-icon-xs h-icon-xs" />
                        {cancelTaskMutation.isPending
                          ? t('customerTaskDetails.cancelling')
                          : t('customerTaskDetails.cancelTask')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-body text-foreground">
                      <Calendar className="w-icon-sm h-icon-sm text-muted-foreground" />
                      <span>{formatDate(task.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-body text-foreground">
                      <Clock className="w-icon-sm h-icon-sm text-muted-foreground" />
                      <span>{formatTime(task.scheduled_at)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:text-right">
                    <div className="text-caption font-sans font-medium uppercase tracking-caps text-muted-foreground">
                      {t('customerTaskDetails.budgetLabel')}
                    </div>
                    <div className="text-price-display font-display text-foreground">
                      ₮{(task.budget ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-2/5">
            <div className="space-y-5 mt-6 lg:mt-0">
              <h2 className="text-xl font-semibold font-display text-foreground">
                {t('customerTaskDetails.applicantsTitle')}
              </h2>

              {isAssigned ? (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                      <UserCheck className="w-icon-sm h-icon-sm text-primary" />
                    </div>
                    <CardTitle className="text-card-title mb-2">
                      {t('customerTaskDetails.taskAssignedTitle')}
                    </CardTitle>
                    <CardDescription className="mb-6 max-w-xs">
                      {t('customerTaskDetails.taskAssignedDesc')}
                    </CardDescription>
                    <Button onClick={() => navigate('/booking/safety')}>
                      {t('customerTaskDetails.goToBookingManagement')}
                    </Button>
                  </CardContent>
                </Card>
              ) : applicationsError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {applicationsError.message ?? t('customerTaskDetails.failedToLoadApplications')}
                  </AlertDescription>
                </Alert>
              ) : applicationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !applicationsPage?.data || applicationsPage.data.length === 0 ? (
                <Card className="border-dashed bg-muted/20 p-10 text-center">
                  <p className="text-body text-muted-foreground">
                    {t('customerTaskDetails.waitingForTaskers')}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {applicationsPage.data.map((app) => (
                    <ApplicationCard key={app.id} application={app} taskId={task.id} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function ApplicationCard({
  application,
  taskId,
}: {
  application: TaskApplication;
  taskId: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
            <Avatar className="h-10 w-10 ring-1 ring-inset ring-border/40 shrink-0">
              {application.tasker.avatar_url ? (
                <AvatarImage src={application.tasker.avatar_url} />
              ) : null}
              <AvatarFallback className="bg-muted/30 text-label font-display font-semibold">
                {application.tasker.full_name?.charAt(0) ?? 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-semibold text-label text-foreground truncate max-w-full">
                  {application.tasker.full_name}
                </span>
                <Badge variant="verified" size="sm" className="max-w-full">
                  <span className="truncate block">
                    {t('customerTaskDetails.idVerifiedTasker')}
                  </span>
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5 font-medium text-foreground">
                  <Star className="w-icon-xs h-icon-xs fill-primary text-primary" />
                  {application.tasker.rating_avg.toFixed(1)}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>
                  {t('customerTaskDetails.tasksDone', {
                    count: application.tasker.completed_tasks,
                  })}
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              navigate(
                `/customer/booking-confirmation?taskId=${taskId}&applicationId=${application.id}`,
              )
            }
            className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
          >
            {t('customerTaskDetails.reviewAndAccept')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 pb-3 text-body-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {application.message}
      </CardContent>
      <CardFooter className="px-4 sm:px-5 py-3 text-caption text-muted-foreground">
        {t('customerTaskDetails.appliedAgo', {
          timeAgo: formatRelativeTime(application.created_at, t),
        })}
      </CardFooter>
    </Card>
  );
}

import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { Calendar, ChevronLeft, Clock, MapPin, Star, UserCheck } from 'lucide-react';
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

function formatTimeAgo(value: string, t: TFunction): string {
  const timestamp = new Date(value).getTime();
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return t('customerTaskDetails.justNow', 'just now');
  }
  if (diffMinutes < 60) {
    return t('customerTaskDetails.m_ago', '{{count}}m ago', { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t('customerTaskDetails.h_ago', '{{count}}h ago', { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  return t('customerTaskDetails.d_ago', '{{count}}d ago', { count: diffDays });
}

export function CustomerTaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { apiClient, session } = useAppContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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

  if (tasksLoading) {
    return (
      <ScreenFrame>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </ScreenFrame>
    );
  }

  if (!task) {
    return (
      <ScreenFrame>
        <Alert variant="destructive">
          <AlertTitle>{t('customerTaskDetails.notFoundTitle', 'Not Found')}</AlertTitle>
          <AlertDescription>
            {t(
              'customerTaskDetails.notFoundDesc',
              "Task not found or you don't have permission to view it.",
            )}
          </AlertDescription>
        </Alert>
        <Button variant="ghost" onClick={() => navigate('/customer/tasks')} className="mt-4">
          {t('customerTaskDetails.backToMyTasks', 'Back to My Tasks')}
        </Button>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame maxWidth="wide">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/customer/tasks')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground truncate">
            {task.description}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="lg:w-3/5">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      {task.category
                        ? i18n.language === 'mn'
                          ? task.category.name_mn
                          : task.category.name
                        : t('category.' + task.category_id)}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {task.location_text}
                    </CardDescription>
                  </div>
                  <Badge
                    className="text-sm px-3 py-1"
                    variant={task.status === 'OPEN' ? 'default' : 'secondary'}
                  >
                    {task.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(task.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(task.scheduled_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="space-y-3 sm:text-right">
                  <div className="text-sm text-muted-foreground uppercase tracking-[0.075em] font-semibold">
                    {t('customerTaskDetails.budgetLabel', 'Budget')}
                  </div>
                  <div className="text-2xl font-bold font-display text-foreground">
                    ₮{task.budget.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-2/5">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold font-display mt-4 lg:mt-0">
                {t('customerTaskDetails.applicantsTitle', 'Applicants')}
              </h2>

              {isAssigned ? (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <UserCheck className="w-6 h-6 text-primary mb-4" />
                    <CardTitle className="mb-2">
                      {t('customerTaskDetails.taskAssignedTitle', 'Task is assigned')}
                    </CardTitle>
                    <CardDescription className="mb-4">
                      {t(
                        'customerTaskDetails.taskAssignedDesc',
                        'You have already accepted a Tasker for this task.',
                      )}
                    </CardDescription>
                    <Button onClick={() => navigate('/booking/safety')}>
                      {t('customerTaskDetails.goToBookingManagement', 'Go to Booking Management')}
                    </Button>
                  </CardContent>
                </Card>
              ) : applicationsError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {applicationsError.message ??
                      t(
                        'customerTaskDetails.failedToLoadApplications',
                        'Failed to load applications',
                      )}
                  </AlertDescription>
                </Alert>
              ) : applicationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : !applicationsPage?.data || applicationsPage.data.length === 0 ? (
                <Card className="border-dashed p-8 text-center text-muted-foreground">
                  {t('customerTaskDetails.waitingForTaskers', 'Waiting for Taskers to apply...')}
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
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 sm:p-6 bg-muted/20 border-b">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border">
              {application.tasker.avatar_url ? (
                <AvatarImage src={application.tasker.avatar_url} />
              ) : null}
              <AvatarFallback>{application.tasker.full_name?.charAt(0) ?? 'T'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold font-display text-lg flex items-center gap-2">
                {application.tasker.full_name}
                {application.tasker.is_pro && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    PRO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  {application.tasker.rating_avg.toFixed(1)}
                </span>
                <span>•</span>
                <span>
                  {t('customerTaskDetails.tasksDone', '{{count}} tasks done', {
                    count: application.tasker.completed_tasks,
                  })}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/customer/booking-confirmation?taskId=${taskId}&applicationId=${application.id}`,
              )
            }
          >
            {t('customerTaskDetails.reviewAndAccept', 'Review & Accept')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 text-sm text-foreground/90 whitespace-pre-wrap">
        "{application.message}"
      </CardContent>
      <CardFooter className="px-4 py-3 bg-muted/10 text-xs text-muted-foreground border-t">
        {t('customerTaskDetails.appliedAgo', 'Applied {{timeAgo}}', {
          timeAgo: formatTimeAgo(application.created_at, t),
        })}
      </CardFooter>
    </Card>
  );
}

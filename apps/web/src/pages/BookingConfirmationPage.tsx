import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ChevronLeft, ClipboardList, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { useAppContext } from '../context/AppContext';
import { ScreenFrame } from '../layout/ScreenFrame';
import type { Booking, BookingIntent } from '../lib/apiClient';
import { parseError } from '../lib/errorHandling';
import { createIdempotencyKey } from '../lib/idempotency';

export function BookingConfirmationPage() {
  const { apiClient, session, trackClientEvent } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const taskId = searchParams.get('taskId');
  const applicationId = searchParams.get('applicationId');
  const source = searchParams.get('source') ?? 'application';
  const bookingIntentId = searchParams.get('bookingIntentId');

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [pendingSelection, setPendingSelection] = useState<BookingIntent | null>(null);

  // Fetch Task and Application strictly for displaying info nicely (if possible)
  const { data: tasksPage, isLoading: loadingTask } = useQuery({
    queryKey: ['customerTasks', session, apiClient],
    queryFn: async () => apiClient.listMyTasks(session!.accessToken),
    enabled: !!session && !!taskId,
  });

  const { data: appsPage, isLoading: loadingApp } = useQuery({
    queryKey: ['taskApplications', taskId, session, apiClient],
    queryFn: async () => apiClient.listTaskApplications(session!.accessToken, taskId!),
    enabled: !!session && !!taskId && source === 'application' && !!applicationId,
  });

  const acceptMutation = useMutation({
    mutationKey: ['acceptBooking', session, taskId, applicationId, bookingIntentId, apiClient],
    mutationFn: async () => {
      if (!session) throw new Error('Missing requirements');
      if (source === 'rebook') {
        if (!bookingIntentId) throw new Error('Missing booking intent');
        return apiClient.confirmBookingIntent(
          session.accessToken,
          bookingIntentId,
          disclaimerAccepted,
          createIdempotencyKey('confirm-intent'),
        );
      }
      if (!taskId || !applicationId) throw new Error('Missing requirements');
      return apiClient.acceptApplication(
        session.accessToken,
        taskId,
        applicationId,
        disclaimerAccepted,
        createIdempotencyKey('accept-application'),
      );
    },
    onSuccess: (result) => {
      if ('source' in result && result.source === 'APPLICATION_SELECTION') {
        const intent = result as BookingIntent;
        setPendingSelection(intent);
        trackClientEvent('APPLICATION_SELECTED', {
          taskId: intent.task_id,
          bookingId: intent.id,
        });
      } else {
        const booking = result as Booking;
        setSuccessBooking(booking);
        trackClientEvent('BOOKING_CONFIRMED', {
          taskId: taskId || undefined,
          bookingId: booking.id,
        });
      }
    },
  });

  if (source !== 'rebook' && (!taskId || !applicationId)) {
    return (
      <ScreenFrame maxWidth="narrow">
        <Alert variant="destructive">
          <AlertTitle>{t('bookingConfirmation.invalidRequestTitle')}</AlertTitle>
          <AlertDescription>{t('bookingConfirmation.invalidRequestDesc')}</AlertDescription>
        </Alert>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/customer/tasks')}>
          {t('bookingConfirmation.backToDashboard')}
        </Button>
      </ScreenFrame>
    );
  }

  if (source === 'rebook' && !bookingIntentId) {
    return (
      <ScreenFrame maxWidth="narrow">
        <Alert variant="destructive">
          <AlertTitle>{t('bookingConfirmation.invalidRequestTitle')}</AlertTitle>
          <AlertDescription>{t('bookingConfirmation.invalidRequestDesc')}</AlertDescription>
        </Alert>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/customer/tasks')}>
          {t('bookingConfirmation.backToDashboard')}
        </Button>
      </ScreenFrame>
    );
  }

  const task = tasksPage?.data.find((t) => t.id === taskId);
  const application = applicationId
    ? appsPage?.data.find((a) => a.id === applicationId)
    : undefined;

  if (pendingSelection) {
    return (
      <ScreenFrame maxWidth="narrow">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">
            {t('bookingConfirmation.selectionRequestedTitle')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('bookingConfirmation.selectionRequestedDesc')}
          </p>

          <Card className="w-full text-left mb-8 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">
                {t('bookingConfirmation.selectionRequestDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-3">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t('bookingConfirmation.selectionRequestId')}
                </span>
                <span className="font-medium text-right break-all">{pendingSelection.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('bookingConfirmation.status')}</span>
                <span className="font-medium text-primary">{pendingSelection.status}</span>
              </div>
              {pendingSelection.expires_at && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t('bookingConfirmation.respondBy')}
                  </span>
                  <span className="font-medium text-right">
                    {new Date(pendingSelection.expires_at).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/customer/tasks')}
          >
            {t('bookingConfirmation.backToTasks')}
          </Button>
        </div>
      </ScreenFrame>
    );
  }

  if (successBooking) {
    return (
      <ScreenFrame maxWidth="narrow">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">
            {t('bookingConfirmation.bookingConfirmedTitle')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('bookingConfirmation.bookingConfirmedDesc')}
          </p>

          <Card className="w-full text-left mb-8 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">{t('bookingConfirmation.bookingDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('bookingConfirmation.bookingId')}</span>
                <span className="font-medium">{successBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('bookingConfirmation.status')}</span>
                <span className="font-medium text-primary">{successBooking.status}</span>
              </div>
              {task && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('bookingConfirmation.totalBudget')}
                  </span>
                  <span className="font-semibold font-display text-lg">
                    ₮{(task.budget ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/customer/tasks')}
            >
              {t('bookingConfirmation.backToTasks')}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/booking/safety')}
            >
              {t('bookingConfirmation.manageBooking')}
            </Button>
          </div>
        </div>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame maxWidth="narrow">
      <div>
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('bookingConfirmation.back')}
        </Button>

        <h1 className="text-3xl font-bold font-display tracking-tight mb-8">
          {t('bookingConfirmation.confirmBookingTitle')}
        </h1>

        <div className="grid gap-8 md:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold font-display mb-4">
                {t('bookingConfirmation.taskDetailsTitle')}
              </h2>
              {loadingTask ? (
                <Skeleton className="w-full h-24" />
              ) : task ? (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium font-display text-lg leading-tight mb-1">
                      {task.description}
                    </h3>
                    <p className="text-muted-foreground text-sm">{task.location_text}</p>
                    <div className="mt-3 text-sm font-medium">
                      {t('bookingConfirmation.scheduledFor', {
                        date: new Date(task.scheduled_at).toLocaleString(),
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('bookingConfirmation.taskLoadError')}
                </p>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold font-display mb-4">
                {t('bookingConfirmation.selectedTaskerTitle')}
              </h2>
              {loadingApp ? (
                <Skeleton className="w-full h-20" />
              ) : application ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                  <Avatar className="w-14 h-14 border">
                    {application.tasker.avatar_url && (
                      <AvatarImage src={application.tasker.avatar_url} />
                    )}
                    <AvatarFallback>
                      {application.tasker.full_name?.charAt(0) ?? 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold font-display text-lg">
                      {application.tasker.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ⭐ {application.tasker.rating_avg.toFixed(1)} •{' '}
                      {t('bookingConfirmation.completedTasks', {
                        count: application.tasker.completed_tasks,
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {source === 'rebook'
                    ? t('bookingConfirmation.rebookTaskerPending')
                    : t('bookingConfirmation.applicantLoadError')}
                </p>
              )}
            </section>

            <section className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">
                  {t('bookingConfirmation.trustSafetyGuarantee')}
                </p>
                <p className="text-muted-foreground">{t('bookingConfirmation.trustSafetyDesc')}</p>
              </div>
            </section>

            {acceptMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('bookingConfirmation.errorTitle')}</AlertTitle>
                <AlertDescription>{parseError(acceptMutation.error)}</AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Card className="sticky top-6 border-primary/20 shadow-lg">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  {t('bookingConfirmation.summaryTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">
                    {t('bookingConfirmation.taskBudget')}
                  </span>
                  <span className="font-medium">
                    {task?.budget ? `₮${task.budget.toLocaleString()}` : '—'}
                  </span>
                </div>
                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground mb-6">
                  {t('bookingConfirmation.settlementNotice')}
                </p>

                <div className="flex items-start space-x-3 mb-6 bg-muted/20 p-3 rounded-md border">
                  <Checkbox
                    id="liability-disclaimer"
                    checked={disclaimerAccepted}
                    onCheckedChange={(c) => setDisclaimerAccepted(c as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="liability-disclaimer"
                      className="text-sm font-medium leading-tight cursor-pointer"
                    >
                      {t('bookingConfirmation.acceptTerms')}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t('bookingConfirmation.termsDesc')}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full text-lg h-12"
                  disabled={!disclaimerAccepted || acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                >
                  {acceptMutation.isPending
                    ? t('bookingConfirmation.confirming')
                    : t('bookingConfirmation.confirmBookingBtn')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

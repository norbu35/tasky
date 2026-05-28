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
import { formatDateTime } from '../lib/formatDate';
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
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
            {t('bookingConfirmation.selectionRequestedTitle')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('bookingConfirmation.selectionRequestedDesc')}
          </p>

          <Card className="w-full text-left mb-8 shadow-elevated border border-border/40 overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <CardTitle className="text-lg">
                {t('bookingConfirmation.selectionRequestDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid gap-3">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t('bookingConfirmation.selectionRequestId')}
                </span>
                <span className="font-semibold text-right break-all">{pendingSelection.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('bookingConfirmation.status')}</span>
                <span className="font-semibold text-primary">{pendingSelection.status}</span>
              </div>
              {pendingSelection.expires_at && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t('bookingConfirmation.respondBy')}
                  </span>
                  <span className="font-semibold text-right">
                    {formatDateTime(pendingSelection.expires_at)}
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
          <div className="w-20 h-20 bg-verified/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-6 h-6 text-verified" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
            {t('bookingConfirmation.bookingConfirmedTitle')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('bookingConfirmation.bookingConfirmedDesc')}
          </p>

          <Card className="w-full text-left mb-8 shadow-elevated border border-border/40 overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <CardTitle className="text-lg">{t('bookingConfirmation.bookingDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('bookingConfirmation.bookingId')}</span>
                <span className="font-semibold">{successBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('bookingConfirmation.status')}</span>
                <span className="font-semibold text-primary">{successBooking.status}</span>
              </div>
              {task && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {t('bookingConfirmation.totalBudget')}
                  </span>
                  <span className="font-bold font-display text-heading-3 text-primary">
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
    <ScreenFrame maxWidth="wide">
      <div>
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('bookingConfirmation.back')}
        </Button>

        <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">
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
                  <CardContent className="p-5 sm:p-6">
                    <h3 className="font-medium font-display text-lg leading-tight mb-1">
                      {task.description}
                    </h3>
                    <p className="text-muted-foreground text-sm">{task.location_text}</p>
                    <div className="mt-3 text-sm font-medium">
                      {t('bookingConfirmation.scheduledFor', {
                        date: formatDateTime(task.scheduled_at),
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
              <h2 className="text-heading-3 font-semibold font-display mb-4">
                {t('bookingConfirmation.selectedTaskerTitle')}
              </h2>
              {loadingApp ? (
                <Skeleton className="w-full h-20 rounded-2xl" />
              ) : application ? (
                <div className="flex items-center gap-4 p-5 sm:p-6 border border-border/60 rounded-2xl bg-card text-card-foreground shadow-elevated hover:shadow-deep transition-all duration-300">
                  <Avatar className="w-14 h-14 border border-border/80 shadow-card">
                    {application.tasker.avatar_url && (
                      <AvatarImage src={application.tasker.avatar_url} />
                    )}
                    <AvatarFallback className="font-display font-semibold bg-primary/10 text-primary">
                      {application.tasker.full_name?.charAt(0) ?? 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold font-display text-lg text-foreground">
                      {application.tasker.full_name}
                    </div>
                    <div className="text-body-sm text-muted-foreground font-medium mt-0.5">
                      ⭐ {application.tasker.rating_avg.toFixed(1)} •{' '}
                      {t('bookingConfirmation.completedTasks', {
                        count: application.tasker.completed_tasks,
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-medium">
                  {source === 'rebook'
                    ? t('bookingConfirmation.rebookTaskerPending')
                    : t('bookingConfirmation.applicantLoadError')}
                </p>
              )}
            </section>

            <section className="bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/40 flex items-start gap-3 shadow-card hover:bg-muted/40 transition-colors">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-foreground mb-1">
                  {t('bookingConfirmation.trustSafetyGuarantee')}
                </p>
                <p className="text-muted-foreground font-medium">
                  {t('bookingConfirmation.trustSafetyDesc')}
                </p>
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

                <div className="flex items-start space-x-3 mb-6 bg-muted/20 p-4 rounded-2xl border border-border/60 shadow-sm transition-colors hover:bg-muted/30">
                  <Checkbox
                    id="liability-disclaimer"
                    checked={disclaimerAccepted}
                    onCheckedChange={(c) => setDisclaimerAccepted(c as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="liability-disclaimer"
                      className="text-sm font-semibold leading-tight cursor-pointer text-foreground"
                    >
                      {t('bookingConfirmation.acceptTerms')}
                    </label>
                    <p className="text-caption text-muted-foreground font-medium">
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

import { useQuery } from '@tanstack/react-query';
import { Clock, MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../layout/parity';
import { formatDateTime } from '../../lib/formatDate';

const BOOKING_STATUS_BADGE_VARIANT: Record<
  string,
  'statusAssigned' | 'statusCompleted' | 'statusCancelled' | 'noShow' | 'outline'
> = {
  ASSIGNED: 'statusAssigned',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
  NO_SHOW: 'noShow',
};

export function CustomerBookingDetailPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['customerBookingDetail', session, bookingId, apiClient],
    queryFn: async () => {
      if (!session || !bookingId) {
        throw new Error('Not authenticated');
      }

      return apiClient.getBooking(session.accessToken, bookingId);
    },
    enabled: !!session && !!bookingId,
  });

  const { data: scheduleEvents } = useQuery({
    queryKey: ['bookingScheduleEvents', session, bookingId, apiClient],
    queryFn: async () => {
      if (!session || !bookingId) return { data: [], cursor: { next: null, has_more: false } };
      return apiClient.listBookingScheduleEvents(session.accessToken, bookingId);
    },
    enabled: !!session && !!bookingId,
  });

  if (!bookingId) {
    return (
      <ResponsiveDetailShell
        title={t('customerPages.bookingDetail.title')}
        description={t('customerPages.bookingDetail.description')}
      >
        <StatePanel
          title={t('customerPages.bookingDetail.loadingTitle')}
          description={t('customerPages.bookingDetail.invalidDesc')}
          tone="destructive"
        />
      </ResponsiveDetailShell>
    );
  }

  return (
    <ResponsiveDetailShell
      title={t('customerPages.bookingDetail.title')}
      description={t('customerPages.bookingDetail.description')}
      primaryAction={
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/booking/safety?bookingId=${bookingId}`)}
        >
          {t('customerPages.bookingDetail.openSafety')}
        </Button>
      }
      detailRail={
        <ActionRail
          title={t('customerPages.bookingDetail.nextStep')}
          primaryAction={
            <Button type="button" className="w-full" onClick={() => navigate('/communication')}>
              {t('customerPages.bookingDetail.messageTasker')}
            </Button>
          }
          secondaryActions={
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/booking/safety?bookingId=${bookingId}`)}
            >
              {t('customerPages.bookingDetail.openSafety')}
            </Button>
          }
        />
      }
    >
      {data ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold font-display leading-tight">
                {data.task?.description ??
                  t('customerPages.bookingDetail.taskFallback', {
                    id:
                      data.task_id.length > 12
                        ? `${data.task_id.substring(0, 8)}...`
                        : data.task_id,
                  })}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {t('customerPages.bookingDetail.bookingIdLabel', { id: data.id })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">
                {t('customerPages.bookingDetail.statusLabel')}
              </span>
              <Badge
                variant={BOOKING_STATUS_BADGE_VARIANT[data.status] ?? 'outline'}
                className="font-medium"
              >
                {t(`sharedPages.status.${data.status}`)}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">
                {t('customerPages.bookingDetail.taskerLabel')}
              </span>
              <span className="font-mono text-xs">{data.tasker_id}</span>
            </div>
            {scheduleEvents?.data && scheduleEvents.data.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('customerPages.bookingDetail.timelineTitle')}
                </div>
                <div className="space-y-2">
                  {scheduleEvents.data.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 text-xs rounded-xl px-3 py-2 bg-muted/25 border border-border/40 transition-colors hover:bg-muted/40"
                    >
                      <span className="font-mono text-muted-foreground shrink-0 font-medium">
                        {formatDateTime(event.created_at)}
                      </span>
                      <Badge variant="outline" className="text-[10px] rounded-lg">
                        {event.event_type}
                      </Badge>
                      {event.reason && (
                        <span className="text-muted-foreground truncate font-medium">
                          — {event.reason}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <StatePanel
          title={t('customerPages.bookingDetail.loadingTitle')}
          description={t('customerPages.bookingDetail.loadingDesc')}
          tone="muted"
        />
      )}
    </ResponsiveDetailShell>
  );
}

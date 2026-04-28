import { useQuery } from '@tanstack/react-query';
import { Clock, MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../layout/parity';

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
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{data.id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('customerPages.bookingDetail.taskLabel', { id: data.task_id })}
              </p>
            </div>
            <MessageSquareText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div>
              {t('customerPages.bookingDetail.statusLabel')} {data.status}
            </div>
            <div>
              {t('customerPages.bookingDetail.taskerLabel')} {data.tasker_id}
            </div>
            {scheduleEvents?.data && scheduleEvents.data.length > 0 && (
              <div className="mt-3 border-t pt-3 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {t('customerPages.bookingDetail.timelineTitle')}
                </div>
                {scheduleEvents.data.map((event) => (
                  <div key={event.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                    <Badge variant="outline">{event.event_type}</Badge>
                    {event.reason && (
                      <span className="text-muted-foreground">— {event.reason}</span>
                    )}
                  </div>
                ))}
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

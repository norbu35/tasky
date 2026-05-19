import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  MessageSquareText,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../layout/parity';
import type { TimelineItem } from '../../layout/parity/TimelineList';
import { TimelineList } from '../../layout/parity/TimelineList';
import { formatDateTime } from '../../lib/formatDate';

const statusBadgeVariant: Record<
  string,
  'statusAssigned' | 'statusCompleted' | 'statusCancelled' | 'noShow' | 'default'
> = {
  ASSIGNED: 'statusAssigned',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
  NO_SHOW: 'noShow',
};

const statusTimelineTone: Record<string, TimelineItem['tone']> = {
  ASSIGNED: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'warning',
  NO_SHOW: 'warning',
  DISPUTED: 'warning',
};

export function TaskerBookingDetailPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['taskerBookingDetail', session, bookingId, apiClient],
    queryFn: async () => {
      if (!session || !bookingId) {
        throw new Error('Not authenticated');
      }

      return apiClient.getBooking(session.accessToken, bookingId);
    },
    enabled: !!session && !!bookingId,
  });

  const { data: scheduleEvents } = useQuery({
    queryKey: ['taskerBookingScheduleEvents', session, bookingId, apiClient],
    queryFn: async () => {
      if (!session || !bookingId) return { data: [], cursor: { next: null, has_more: false } };
      return apiClient.listBookingScheduleEvents(session.accessToken, bookingId);
    },
    enabled: !!session && !!bookingId,
  });

  if (!bookingId) {
    return (
      <ResponsiveDetailShell
        title={t('taskerPages.bookingDetail.title')}
        description={t('taskerPages.bookingDetail.description')}
      >
        <StatePanel
          title={t('common.error')}
          description={t('taskerPages.bookingDetail.content')}
          tone="destructive"
          icon={<Shield className="h-5 w-5" />}
        />
      </ResponsiveDetailShell>
    );
  }

  const timelineItems: TimelineItem[] = (scheduleEvents?.data ?? []).map((event) => ({
    label: event.event_type,
    detail: event.reason ?? undefined,
    time: formatDateTime(event.created_at),
    tone: statusTimelineTone[event.event_type] ?? 'muted',
  }));

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.bookingDetail.title')}
      description={t('taskerPages.bookingDetail.description')}
      detailRail={
        data ? (
          <ActionRail
            title={t('taskerPages.bookingDetail.actionsTitle')}
            primaryAction={
              data.status === 'ASSIGNED' ? (
                <Button type="button" className="w-full" onClick={() => navigate('/communication')}>
                  <MessageSquareText className="w-4 h-4 mr-2" />
                  {t('common.customer')}
                </Button>
              ) : null
            }
            secondaryActions={
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/booking/safety?bookingId=${bookingId}`)}
              >
                <Shield className="w-4 h-4 mr-2" />
                {t('taskerPages.bookingDetail.cardDesc')}
              </Button>
            }
          />
        ) : undefined
      }
    >
      {data ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="truncate">{data.task?.description ?? data.id}</CardTitle>
                <p className="text-body-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {formatDateTime(data.confirmed_scheduled_at)}
                </p>
              </div>
              <Badge variant={statusBadgeVariant[data.status] ?? 'default'} className="shrink-0">
                {data.status}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 bg-muted/10 p-3 rounded-xl ring-1 ring-inset ring-border/20">
                  <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
                  <span className="text-body-sm font-medium truncate">
                    {data.task?.location_text ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 bg-muted/10 p-3 rounded-xl ring-1 ring-inset ring-border/20">
                  <span className="text-body-sm font-medium">
                    <span className="text-muted-foreground">
                      {t('taskerPages.bookingDetail.cardDesc')}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted/5 p-3 rounded-xl ring-1 ring-inset ring-border/20 mt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      data.status === 'COMPLETED' ? 'text-status-completed' : 'text-primary/60'
                    }`}
                  />
                  <span className="text-body-sm font-medium">
                    {data.status === 'COMPLETED'
                      ? t('taskerPages.jobs.statusCompleted')
                      : t('taskerPages.jobs.statusAssigned')}
                  </span>
                </div>
                <div className="text-price-display font-display font-bold text-primary">
                  {data.price.toLocaleString()}
                  <span className="text-body-sm font-normal text-muted-foreground ml-1">MNT</span>
                </div>
              </div>

              {data.task?.description && (
                <div className="mt-1 p-4 rounded-xl ring-1 ring-inset ring-border/20 bg-background">
                  <h4 className="text-xs uppercase tracking-caps font-semibold text-muted-foreground mb-2">
                    {t('taskerFeed.descriptionLabel')}
                  </h4>
                  <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {data.task.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {timelineItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Clock className="h-4 w-4 text-primary/60" />
                  {t('customerPages.bookingDetail.timelineTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineList items={timelineItems} />
              </CardContent>
            </Card>
          )}
        </div>
      ) : isLoading ? (
        <StatePanel
          title={t('common.loading')}
          description={t('taskerPages.bookingDetail.content')}
          tone="muted"
          icon={<Loader2 className="h-5 w-5 animate-spin" />}
        />
      ) : (
        <StatePanel
          title={t('common.error')}
          description={t('taskerPages.bookingDetail.content')}
          tone="destructive"
        />
      )}
    </ResponsiveDetailShell>
  );
}

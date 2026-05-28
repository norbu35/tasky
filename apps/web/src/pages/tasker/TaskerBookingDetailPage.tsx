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
import { cn } from '../../lib/utils';

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
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-none shadow-deep ring-1 ring-border/10">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-8 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
              <div className="min-w-0 space-y-2">
                <Badge
                  variant={statusBadgeVariant[data.status] ?? 'default'}
                  size="md"
                  isCaps
                  className="mb-2"
                >
                  {data.status}
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {data.task?.description ?? data.id}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-body-sm text-muted-foreground font-medium pt-1">
                  <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4 text-primary/60" />
                    {formatDateTime(data.confirmed_scheduled_at)}
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    {data.task?.location_text ?? '—'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0">
              <div className="grid gap-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-primary/[0.03] p-4 sm:p-6 rounded-3xl ring-1 ring-inset ring-primary/10 gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl shadow-card ring-1 ring-inset',
                        data.status === 'COMPLETED'
                          ? 'bg-verified/10 ring-verified/20 text-verified'
                          : 'bg-primary/10 ring-primary/20 text-primary',
                      )}
                    >
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                        {t('taskerPages.bookingDetail.actionsTitle')}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {data.status === 'COMPLETED'
                          ? t('taskerPages.jobs.statusCompleted')
                          : t('taskerPages.jobs.statusAssigned')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end bg-background sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none ring-1 ring-border/10 sm:ring-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                      {t('customerTaskDetails.budgetLabel')}
                    </p>
                    <div className="text-3xl font-display font-black text-primary flex items-baseline gap-1">
                      {data.price.toLocaleString()}
                      <span className="text-sm font-bold text-primary/50">MNT</span>
                    </div>
                  </div>
                </div>

                {data.task?.description && (
                  <div className="bg-muted/5 p-6 rounded-3xl ring-1 ring-inset ring-border/10">
                    <h4 className="text-[11px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      {t('taskerFeed.descriptionLabel')}
                    </h4>
                    <p className="text-body-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                      {data.task.description}
                    </p>
                  </div>
                )}
              </div>
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

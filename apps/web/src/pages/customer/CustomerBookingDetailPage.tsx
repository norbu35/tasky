import { useQuery } from '@tanstack/react-query';
import { MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

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

  if (!bookingId) {
    return (
      <ResponsiveDetailShell
        title={t('customerPages.bookingDetail.title', 'Booking detail')}
        description={t(
          'customerPages.bookingDetail.description',
          'Review the booking status, message the tasker, or continue to safety actions.',
        )}
      >
        <StatePanel
          title={t('customerPages.bookingDetail.loadingTitle', 'Loading booking detail')}
          description={t(
            'customerPages.bookingDetail.invalidDesc',
            'Booking ID is missing from the route.',
          )}
          tone="destructive"
        />
      </ResponsiveDetailShell>
    );
  }

  return (
    <ResponsiveDetailShell
      title={t('customerPages.bookingDetail.title', 'Booking detail')}
      description={t(
        'customerPages.bookingDetail.description',
        'Review the booking status, message the tasker, or continue to safety actions.',
      )}
      primaryAction={
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/booking/safety?bookingId=${bookingId}`)}
        >
          {t('customerPages.bookingDetail.openSafety', 'Open booking safety')}
        </Button>
      }
      detailRail={
        <ActionRail
          title={t('customerPages.bookingDetail.nextStep', 'Next step')}
          primaryAction={
            <Button type="button" className="w-full" onClick={() => navigate('/communication')}>
              {t('customerPages.bookingDetail.messageTasker', 'Message tasker')}
            </Button>
          }
          secondaryActions={
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/booking/safety?bookingId=${bookingId}`)}
            >
              {t('customerPages.bookingDetail.openSafety', 'Open booking safety')}
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
                {t('customerPages.bookingDetail.taskLabel', 'Task {{id}}', { id: data.task_id })}
              </p>
            </div>
            <MessageSquareText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div>
              {t('customerPages.bookingDetail.statusLabel', 'Status:')} {data.status}
            </div>
            <div>
              {t('customerPages.bookingDetail.taskerLabel', 'Tasker:')} {data.tasker_id}
            </div>
          </CardContent>
        </Card>
      ) : (
        <StatePanel
          title={t('customerPages.bookingDetail.loadingTitle', 'Loading booking detail')}
          description={t('customerPages.bookingDetail.loadingDesc', 'Loading booking information.')}
          tone="muted"
        />
      )}
    </ResponsiveDetailShell>
  );
}

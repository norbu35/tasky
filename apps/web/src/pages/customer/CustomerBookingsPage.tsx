import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveFeedShell } from '../../layout/parity';
import { formatDate } from '../../lib/formatDate';

const BOOKING_STATUS_BADGE_VARIANT: Record<
  string,
  'statusAssigned' | 'statusCompleted' | 'statusCancelled' | 'noShow' | 'outline'
> = {
  ASSIGNED: 'statusAssigned',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
  NO_SHOW: 'noShow',
};

function getBookingBadgeVariant(status: string) {
  return BOOKING_STATUS_BADGE_VARIANT[status] ?? 'outline';
}

export function CustomerBookingsPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['customerBookings', session, apiClient],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      return apiClient.listBookings(session.accessToken, { role: 'customer' });
    },
    enabled: !!session,
  });

  const bookings = data?.data ?? [];

  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/customer/bookings/${id}`);
    }
  };

  return (
    <ResponsiveFeedShell
      title={t('customerPages.bookings.title')}
      description={t('customerPages.bookings.description')}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {bookings.map((booking) => (
          <Card
            key={booking.id}
            className="hover:border-primary/50 cursor-pointer transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/customer/bookings/${booking.id}`)}
            onKeyDown={(e) => handleKeyDown(e, booking.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold leading-snug">
                    {booking.task?.description ??
                      t('customerPages.bookings.taskFallback', {
                        id:
                          booking.task_id.length > 12
                            ? `${booking.task_id.substring(0, 8)}...`
                            : booking.task_id,
                      })}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-mono">
                    {t('customerPages.bookings.bookingId')}:{' '}
                    {booking.id.length > 12 ? `${booking.id.substring(0, 8)}...` : booking.id}
                  </p>
                </div>
                <Badge variant={getBookingBadgeVariant(booking.status)} className="shrink-0">
                  {t(`sharedPages.status.${booking.status}`, booking.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
              <span className="font-semibold text-foreground">
                ₮{booking.price.toLocaleString()}
              </span>
              {booking.confirmed_scheduled_at && (
                <span className="text-xs">{formatDate(booking.confirmed_scheduled_at)}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ResponsiveFeedShell>
  );
}

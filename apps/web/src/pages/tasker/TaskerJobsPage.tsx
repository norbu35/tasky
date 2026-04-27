import { useQuery } from '@tanstack/react-query';
import { Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function TaskerJobsPage() {
  const { t } = useTranslation();
  const { apiClient, session } = useAppContext();

  const { data: bookingsPage, isLoading } = useQuery({
    queryKey: ['taskerBookings', session, apiClient],
    queryFn: async () => {
      return apiClient.listBookings(session!.accessToken, { role: 'tasker' });
    },
    enabled: !!session,
  });

  const bookings = bookingsPage?.data ?? [];

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.jobs.title')}
      description={t('taskerPages.jobs.description')}
    >
      {isLoading ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('taskerPages.jobs.loading')}</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('taskerPages.jobs.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t('taskerPages.jobs.bookingId')} {booking.id.substring(0, 8)}...
                  </CardTitle>
                  <StatusBadge status={booking.status} />
                </div>
                <CardDescription className="text-xs">
                  {booking.confirmed_scheduled_at &&
                    new Date(booking.confirmed_scheduled_at).toLocaleDateString()}
                  {booking.price != null && ` · ₮${booking.price.toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {booking.status === 'ASSIGNED' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        /* Opens cancel dialog — uses cancelBooking */
                      }}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      {t('taskerPages.jobs.declineBtn')}
                    </Button>
                  </div>
                )}
                {booking.status === 'COMPLETED' && (
                  <p className="text-xs text-muted-foreground">{t('taskerPages.jobs.completed')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ResponsiveDetailShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  switch (status) {
    case 'ASSIGNED':
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {t('taskerPages.jobs.statusAssigned')}
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          {t('taskerPages.jobs.statusCompleted')}
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="gap-1 text-destructive">
          <XCircle className="h-3 w-3" />
          {t('taskerPages.jobs.statusCancelled')}
        </Badge>
      );
    case 'NO_SHOW':
      return (
        <Badge variant="outline" className="gap-1 text-destructive">
          <Briefcase className="h-3 w-3" />
          {t('taskerPages.jobs.statusNoShow')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{t('taskerPages.jobs.statusUnknown', status)}</Badge>;
  }
}

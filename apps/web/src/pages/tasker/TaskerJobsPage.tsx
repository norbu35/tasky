import { useQuery } from '@tanstack/react-query';
import { Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';
import { formatDate } from '../../lib/formatDate';

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
          <CardContent className="p-6 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('taskerPages.jobs.loading')}</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Briefcase className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('taskerPages.jobs.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono tracking-tight">
                    {t('taskerPages.jobs.bookingId')} {booking.id.substring(0, 8)}...
                  </CardTitle>
                  <StatusBadge status={booking.status} />
                </div>
                <CardDescription className="text-xs">
                  {booking.confirmed_scheduled_at && formatDate(booking.confirmed_scheduled_at)}
                  {booking.price != null && ` · ₮${booking.price.toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              {booking.status === 'ASSIGNED' && (
                <CardFooter className="pt-0">
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
                </CardFooter>
              )}
              {booking.status === 'COMPLETED' && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">{t('taskerPages.jobs.completed')}</p>
                </CardContent>
              )}
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
        <Badge variant="statusAssigned" className="gap-1">
          <Clock className="h-3 w-3" />
          {t('taskerPages.jobs.statusAssigned')}
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="statusCompleted" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {t('taskerPages.jobs.statusCompleted')}
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="statusCancelled" className="gap-1">
          <XCircle className="h-3 w-3" />
          {t('taskerPages.jobs.statusCancelled')}
        </Badge>
      );
    case 'NO_SHOW':
      return (
        <Badge variant="noShow" className="gap-1">
          <Briefcase className="h-3 w-3" />
          {t('taskerPages.jobs.statusNoShow')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{t('taskerPages.jobs.statusUnknown', status)}</Badge>;
  }
}

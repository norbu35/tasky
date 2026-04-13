import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useAppContext } from '../../context/AppContext';
import { ResponsiveFeedShell } from '../../layout/parity';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function CustomerBookingsPage() {
  const { apiClient, session } = useAppContext();
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ['customerBookings', session?.accessToken],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      return apiClient.listBookings(session.accessToken, { role: 'customer' });
    },
    enabled: !!session,
  });

  const bookings = data?.data ?? [];

  return (
    <ResponsiveFeedShell
      title={t('customerPages.bookings.title', 'Bookings')}
      description={t(
        'customerPages.bookings.description',
        'Track active, completed, and cancelled bookings in one place.',
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{booking.id}</CardTitle>
                <Badge variant="secondary">{booking.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Task {booking.task_id} • ₮{booking.price.toLocaleString()}
            </CardContent>
          </Card>
        ))}
      </div>
    </ResponsiveFeedShell>
  );
}

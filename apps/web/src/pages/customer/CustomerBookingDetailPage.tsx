import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { useAppContext } from '../../context/AppContext';
import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquareText } from 'lucide-react';

export function CustomerBookingDetailPage() {
  const { apiClient, session } = useAppContext();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') ?? 'booking-1';

  const { data } = useQuery({
    queryKey: ['customerBookingDetail', session?.accessToken, bookingId],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      return apiClient.getBooking(session.accessToken, bookingId);
    },
    enabled: !!session,
  });

  return (
    <ResponsiveDetailShell
      title="Booking detail"
      description="Review the booking status, message the tasker, or continue to safety actions."
      primaryAction={
        <Button type="button" variant="secondary">
          Open booking safety
        </Button>
      }
      detailRail={
        <ActionRail
          title="Next step"
          primaryAction={
            <Button type="button" className="w-full">
              Message tasker
            </Button>
          }
          secondaryActions={
            <Button type="button" variant="outline" className="w-full">
              Open booking safety
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
              <p className="text-sm text-muted-foreground">Task {data.task_id}</p>
            </div>
            <MessageSquareText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div>Status: {data.status}</div>
            <div>Tasker: {data.tasker_id}</div>
          </CardContent>
        </Card>
      ) : (
        <StatePanel
          title="Loading booking detail"
          description="Loading booking information."
          tone="muted"
        />
      )}
    </ResponsiveDetailShell>
  );
}

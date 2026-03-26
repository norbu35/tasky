import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerBookingDetailPage() {
  return (
    <ResponsiveDetailShell title="Booking detail" description="Review booking status, timeline, and support actions.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Taskers can review the booking and respond to issues here.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

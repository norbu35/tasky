import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerBookingConfirmedPage() {
  return (
    <ResponsiveDetailShell
      title="Booking confirmed"
      description="The tasker has been booked and the customer flow can continue to timeline or safety."
      primaryAction={
        <Button type="button" variant="secondary">
          Back to bookings
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Confirmation summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The booking confirmation surface stays available for Phase 1 direct settlement.
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

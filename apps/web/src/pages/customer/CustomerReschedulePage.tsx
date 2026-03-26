import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerReschedulePage() {
  return (
    <ResponsiveDetailShell
      title="Reschedule booking"
      description="Update the booking time while preserving the Phase 1 direct settlement flow."
      primaryAction={
        <Button type="button" variant="secondary">
          Save changes
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Choose a new time</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Keep the booking on the customer timeline until the new time is confirmed.
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

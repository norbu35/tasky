import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerCancelDialog() {
  return (
    <ResponsiveDetailShell title="Cancel booking" description="Cancel an assigned booking with a reason.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Taskers confirm cancellations before the booking is updated.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

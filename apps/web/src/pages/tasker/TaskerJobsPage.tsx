import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerJobsPage() {
  return (
    <ResponsiveDetailShell title="My Jobs" description="Track active and completed work in one place.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Active bookings and recent completed jobs appear here in Phase 1.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

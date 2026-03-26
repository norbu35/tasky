import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerStatsPage() {
  return (
    <ResponsiveDetailShell title="Tasker stats" description="View a concise performance summary.">
      <Card>
        <CardContent className="grid gap-3 p-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>Completion rate, rating, and response time stay visible for taskers.</p>
          <p>Phase 1 keeps the stats surface lightweight and auditable.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

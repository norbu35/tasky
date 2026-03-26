import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerNoShowDialog() {
  return (
    <ResponsiveDetailShell title="No-show reminder" description="Record a no-show reminder before escalation.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>This keeps the manual verification and dispute process explicit for Phase 1.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

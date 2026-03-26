import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerPrivacyPage() {
  return (
    <ResponsiveDetailShell title="Privacy policy" description="How tasker data is handled in Phase 1.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>We only show the minimum task details needed to complete assigned jobs safely.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

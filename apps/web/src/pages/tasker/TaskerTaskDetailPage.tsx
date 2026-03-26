import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerTaskDetailPage() {
  return (
    <ResponsiveDetailShell title="Task detail" description="Review the public task before applying.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Task summary, budget, and approximate location are shown here.</p>
          <p>Manual verification stays intact for Phase 0-1 tasker access.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

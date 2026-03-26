import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerProfilePolishPage() {
  return (
    <ResponsiveDetailShell title="AI profile polish" description="Refine your tasker profile copy before publishing.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Phase 1 uses a simple review-and-apply loop for profile improvements.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

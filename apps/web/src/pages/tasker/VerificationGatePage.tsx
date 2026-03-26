import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationGatePage() {
  return (
    <ResponsiveDetailShell title="Identity verification" description="Start your tasker verification flow.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Manual review is required before a tasker can accept jobs.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

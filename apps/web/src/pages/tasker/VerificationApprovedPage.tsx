import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationApprovedPage() {
  return (
    <ResponsiveDetailShell title="Verification approved" description="Your identity has been approved.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>You can now accept jobs with a verified tasker profile.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

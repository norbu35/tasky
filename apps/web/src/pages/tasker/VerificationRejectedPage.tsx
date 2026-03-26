import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationRejectedPage() {
  return (
    <ResponsiveDetailShell title="Verification rejected" description="Review the rejection reason and try again.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Fix the issues noted by the reviewer before resubmitting.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationPendingPage() {
  return (
    <ResponsiveDetailShell title="Verification pending" description="Your submission is awaiting manual review.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>We will notify you when your verification is reviewed.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

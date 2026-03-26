import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationSubmittedPage() {
  return (
    <ResponsiveDetailShell title="Verification submitted" description="Your verification documents are in the queue.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Submission is recorded and waiting for the reviewer queue.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

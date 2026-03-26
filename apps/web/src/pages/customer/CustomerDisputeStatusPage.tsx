import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerDisputeStatusPage() {
  return (
    <ResponsiveDetailShell
      title="Dispute status"
      description="Review the current dispute state and the next support action."
      primaryAction={
        <Button type="button" variant="secondary">
          Contact support
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Resolution status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The customer can see whether the dispute is open, under review, or resolved.
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

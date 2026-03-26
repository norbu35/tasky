import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerDisputeRaisePage() {
  return (
    <ResponsiveDetailShell
      title="Raise dispute"
      description="Open a dispute while keeping Phase 1 settlement rules intact."
      primaryAction={
        <Button type="button" variant="secondary">
          Submit dispute
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Raise a dispute</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Capture the reason, evidence, and resolution request before escalation.
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

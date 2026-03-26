import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerRebookPage() {
  return (
    <ResponsiveDetailShell
      title="Rebook task"
      description="Start a new booking from the prior task details without breaking direct settlement."
      primaryAction={
        <Button type="button" variant="secondary">
          Continue rebook
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Rebook summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Reuse the same customer details while letting the user choose a fresh schedule.
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

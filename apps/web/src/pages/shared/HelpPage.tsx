import { ResponsiveFeedShell } from '../../components/parity';
import { Card, CardContent } from '../../components/ui/card';

export function HelpPage() {
  return (
    <ResponsiveFeedShell title="Help & support" description="FAQs and next-step guidance for common marketplace issues.">
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="font-semibold">How do I reschedule a booking?</div>
          <div className="text-sm text-muted-foreground">Open the booking detail and choose the new time before the task starts.</div>
        </CardContent>
      </Card>
    </ResponsiveFeedShell>
  );
}

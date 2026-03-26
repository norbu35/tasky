import { TimelineList } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerTimelinePage() {
  return (
    <ResponsiveDetailShell
      title="Booking timeline"
      description="Follow the booking from confirmation to completion and disputes."
      primaryAction={
        <Button type="button" variant="secondary">
          Back to booking
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineList
            items={[
              { label: 'Booking confirmed', detail: 'Customer accepted the tasker', tone: 'completed' },
              { label: 'Task in progress', detail: 'Tasker is on the way', tone: 'active' },
              { label: 'Awaiting completion', detail: 'Capture final review or raise a dispute' },
            ]}
          />
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

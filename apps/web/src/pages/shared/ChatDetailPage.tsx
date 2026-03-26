import { ResponsiveDetailShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';

export function ChatDetailPage() {
  return (
    <ResponsiveDetailShell
      title="Chat detail"
      description="Keep booking communication in one thread."
      backLabel="Back"
      detailRail={
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Booking details and quick actions will live in this rail.
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm">I can arrive by 10:00 tomorrow.</div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Textarea aria-label="Message draft" placeholder="Type your reply" />
          <Button aria-label="Send message" type="button">
            Send message
          </Button>
        </div>
      </div>
    </ResponsiveDetailShell>
  );
}

import { ResponsiveDetailShell } from '../../components/parity';
import { Card, CardContent } from '../../components/ui/card';

export function PrivacyPage() {
  return (
    <ResponsiveDetailShell title="Privacy policy" description="How Tasky handles profile data, booking records, and messages.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>We minimize public address exposure and keep exact location details limited to active booking participants.</p>
          <p>Operational logs and moderation records are retained for trust and safety review.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

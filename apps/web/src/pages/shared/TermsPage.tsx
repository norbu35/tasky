import { ResponsiveDetailShell } from '../../components/parity';
import { Card, CardContent } from '../../components/ui/card';

export function TermsPage() {
  return (
    <ResponsiveDetailShell title="Terms of service" description="Core expectations for customers, taskers, and bookings.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Bookings require honest task descriptions, respectful communication, and accurate arrival timing.</p>
          <p>Disputes should be raised quickly with factual details and supporting context.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

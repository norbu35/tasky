import { ResponsiveDetailShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export function SettingsPage() {
  return (
    <ResponsiveDetailShell title="Settings" description="Account, safety, and session controls.">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <Button type="button" variant="outline">
            Notification preferences
          </Button>
          <Button type="button" variant="secondary">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

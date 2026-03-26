import { useState } from 'react';
import { ResponsiveDetailShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

export function DeleteAccountPage() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ResponsiveDetailShell title="Delete account" description="This action is permanent and should stay frictionful.">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={confirmed} id="delete-confirm" onCheckedChange={(value) => setConfirmed(value === true)} />
          <Label htmlFor="delete-confirm">I understand that my account and history will be removed.</Label>
        </div>
        <Button disabled={!confirmed} type="button" variant="destructive">
          Delete permanently
        </Button>
      </div>
    </ResponsiveDetailShell>
  );
}

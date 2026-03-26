import { AlertTriangle } from 'lucide-react';

import { StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';

export function CustomerTaskCancelDialog() {
  return (
    <StatePanel
      icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
      title="Cancel task?"
      description="Stopping this task will remove it from the active customer flow."
      tone="warning"
      actions={
        <>
          <Button type="button" variant="secondary">
            Keep task
          </Button>
          <Button type="button" variant="destructive">
            Cancel task
          </Button>
        </>
      }
    />
  );
}

import { CheckCircle2 } from 'lucide-react';

import { ResponsiveWizardShell, StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';

export function CustomerTaskSuccessPage() {
  return (
    <ResponsiveWizardShell
      title="Task posted successfully"
      description="Your task is live and ready for taskers to review."
      stepLabel="Customer posting complete"
      footer={
        <div className="flex flex-wrap gap-3">
          <Button type="button">Back to tasks</Button>
          <Button type="button" variant="secondary">
            Post another task
          </Button>
        </div>
      }
    >
      <StatePanel
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        title="Task live"
        description="Taskers can now browse, review, and apply."
        tone="muted"
      />
    </ResponsiveWizardShell>
  );
}

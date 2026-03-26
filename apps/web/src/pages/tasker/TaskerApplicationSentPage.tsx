import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveWizardShell } from '../../components/parity';

export function TaskerApplicationSentPage() {
  const navigate = useNavigate();

  return (
    <ResponsiveWizardShell
      title="Application sent"
      description="Your application has been sent to the customer and is waiting for review."
      footer={
        <Button type="button" onClick={() => navigate('/tasker/tasks')}>
          Back to feed
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">Application sent.</p>
        </CardContent>
      </Card>
    </ResponsiveWizardShell>
  );
}

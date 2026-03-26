import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function TaskerApplicationSentPage() {
  const navigate = useNavigate();

  return (
    <ScreenFrame maxWidth="narrow">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Application sent</h1>
          <p className="text-muted-foreground">
            Your application has been sent to the customer and is waiting for review.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">Application sent.</p>
            <Button type="button" onClick={() => navigate('/tasker/tasks')}>
              Back to feed
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScreenFrame>
  );
}

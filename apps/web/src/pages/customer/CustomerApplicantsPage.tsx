import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

import { ActionRail, ResponsiveDetailShell, StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function CustomerApplicantsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.applicants.title', 'Applicants')}
      description={t('customerPages.applicants.description', 'Review the taskers who are interested in this task.')}
      primaryAction={
        <Button type="button" variant="secondary">
          Open review panel
        </Button>
      }
      detailRail={
        <ActionRail
          title="Next step"
          primaryAction={
            <Button type="button" className="w-full">
              Review task
            </Button>
          }
          footnote="This slice keeps the page self-contained until route wiring lands."
        />
      }
    >
      <div className="space-y-4">
        <StatePanel
          icon={<Users className="h-5 w-5 text-primary" />}
          title={t('customerPages.applicants.loading', 'Loading applicants...')}
          description="Hook this page up to a task ID to show the live applicant queue."
          tone="muted"
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Task review summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The customer parity baseline should keep the review flow ready even before route wiring
            is enabled.
          </CardContent>
        </Card>
      </div>
    </ResponsiveDetailShell>
  );
}

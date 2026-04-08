import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell, StatePanel } from '../../components/parity';
import { Users } from 'lucide-react';

export function CustomerNoApplicantRescuePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.noApplicantRescue.title', 'No applicants yet')}
      description={t(
        'customerPages.noApplicantRescue.description',
        'Keep the task visible and help the customer recover when nobody has applied.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.noApplicantRescue.boostVisibility', 'Boost visibility')}
        </Button>
      }
    >
      <div className="space-y-4">
        <StatePanel
          icon={<Users className="h-5 w-5 text-primary" />}
          title={t('customerPages.noApplicantRescue.recoveryTitle', 'Recovery options')}
          description={t(
            'customerPages.noApplicantRescue.recoveryDesc',
            'Prompt the customer to adjust price, timing, or description.',
          )}
          tone="muted"
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>
              {t('customerPages.noApplicantRescue.rescueTitle', 'Rescue options')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t(
              'customerPages.noApplicantRescue.rescueDesc',
              'Keep the task in the queue and suggest a cheaper or more flexible rebook path.',
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveDetailShell>
  );
}

import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function CustomerDisputeRaisePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.disputeRaise.title', 'Raise dispute')}
      description={t(
        'customerPages.disputeRaise.description',
        'Open a dispute while keeping Phase 1 settlement rules intact.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.disputeRaise.submitAction', 'Submit dispute')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.disputeRaise.cardTitle', 'Raise a dispute')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t(
            'customerPages.disputeRaise.cardDesc',
            'Capture the reason, evidence, and resolution request before escalation.',
          )}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

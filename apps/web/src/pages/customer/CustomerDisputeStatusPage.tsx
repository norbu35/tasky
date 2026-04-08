import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerDisputeStatusPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.disputeStatus.title', 'Dispute status')}
      description={t(
        'customerPages.disputeStatus.description',
        'Review the current dispute state and the next support action.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.disputeStatus.contactSupport', 'Contact support')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.disputeStatus.cardTitle', 'Resolution status')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t(
            'customerPages.disputeStatus.cardDesc',
            'The customer can see whether the dispute is open, under review, or resolved.',
          )}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

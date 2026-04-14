import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function CustomerRebookPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.rebook.title', 'Rebook task')}
      description={t(
        'customerPages.rebook.description',
        'Start a new booking from the prior task details without breaking direct settlement.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.rebook.continueAction', 'Continue rebook')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.rebook.cardTitle', 'Rebook summary')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t(
            'customerPages.rebook.cardDesc',
            'Reuse the same customer details while letting the user choose a fresh schedule.',
          )}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

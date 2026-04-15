import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function CustomerReschedulePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.reschedule.title', 'Reschedule booking')}
      description={t(
        'customerPages.reschedule.description',
        'Update the booking time while preserving the Phase 1 direct settlement flow.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.reschedule.saveChanges', 'Save changes')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.reschedule.cardTitle', 'Choose a new time')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t(
            'customerPages.reschedule.cardDesc',
            'Keep the booking on the customer timeline until the new time is confirmed.',
          )}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

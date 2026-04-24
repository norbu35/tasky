import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function CustomerBookingConfirmedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.bookingConfirmed.title')}
      description={t('customerPages.bookingConfirmed.description')}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.bookingConfirmed.backToBookings')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.bookingConfirmed.summaryTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t('customerPages.bookingConfirmed.summaryDesc')}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

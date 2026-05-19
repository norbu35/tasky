import { CheckCircle2 } from 'lucide-react';
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
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-completed/10 mb-2">
            <CheckCircle2 className="h-7 w-7 text-status-completed" />
          </div>
          <CardTitle>{t('customerPages.bookingConfirmed.summaryTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center">
          {t('customerPages.bookingConfirmed.summaryDesc')}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

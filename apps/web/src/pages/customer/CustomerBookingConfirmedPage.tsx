import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../components/parity';

export function CustomerBookingConfirmedPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.bookingConfirmed.title', 'Booking confirmed')}
      description={t('customerPages.bookingConfirmed.description', 'The tasker has been booked and the customer flow can continue to timeline or safety.')}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.bookingConfirmed.backToBookings', 'Back to bookings')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.bookingConfirmed.summaryTitle', 'Confirmation summary')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t('customerPages.bookingConfirmed.summaryDesc', 'The booking confirmation surface stays available for Phase 1 direct settlement.')}
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

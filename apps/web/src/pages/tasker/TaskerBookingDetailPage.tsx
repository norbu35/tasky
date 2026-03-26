import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerBookingDetailPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('taskerPages.bookingDetail.title', 'Booking detail')} description={t('taskerPages.bookingDetail.description', 'Review booking status, timeline, and support actions.')}>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>{t('taskerPages.bookingDetail.content', 'Taskers can review the booking and respond to issues here.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

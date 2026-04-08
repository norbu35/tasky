import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerCancelDialog() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.cancelDialog.title', 'Cancel booking')}
      description={t(
        'taskerPages.cancelDialog.description',
        'Cancel an assigned booking with a reason.',
      )}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'taskerPages.cancelDialog.content',
              'Taskers confirm cancellations before the booking is updated.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

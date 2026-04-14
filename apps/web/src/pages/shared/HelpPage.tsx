import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveFeedShell } from '../../layout/parity';

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.help.title', 'Help & support')}
      description={t(
        'sharedPages.help.description',
        'FAQs and next-step guidance for common marketplace issues.',
      )}
    >
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="font-semibold">
            {t('sharedPages.help.faq1Question', 'How do I reschedule a booking?')}
          </div>
          <div className="text-sm text-muted-foreground">
            {t(
              'sharedPages.help.faq1Answer',
              'Open the booking detail and choose the new time before the task starts.',
            )}
          </div>
        </CardContent>
      </Card>
    </ResponsiveFeedShell>
  );
}

import { useTranslation } from 'react-i18next';
import { TimelineList } from '../../layout/parity';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity';

export function CustomerTimelinePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.timeline.title', 'Booking timeline')}
      description={t(
        'customerPages.timeline.description',
        'Follow the booking from confirmation to completion and disputes.',
      )}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.timeline.backAction', 'Back to booking')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.timeline.cardTitle', 'Timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineList
            items={[
              {
                label: t('customerPages.timeline.step1', 'Booking confirmed'),
                detail: t('customerPages.timeline.step1Desc', 'Customer accepted the tasker'),
                tone: 'completed',
              },
              {
                label: t('customerPages.timeline.step2', 'Task in progress'),
                detail: t('customerPages.timeline.step2Desc', 'Tasker is on the way'),
                tone: 'active',
              },
              {
                label: t('customerPages.timeline.step3', 'Awaiting completion'),
                detail: t(
                  'customerPages.timeline.step3Desc',
                  'Capture final review or raise a dispute',
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

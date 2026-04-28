import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TimelineList, ResponsiveDetailShell } from '../../layout/parity';

export function CustomerTimelinePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('customerPages.timeline.title')}
      description={t('customerPages.timeline.description')}
      primaryAction={
        <Button type="button" variant="secondary">
          {t('customerPages.timeline.backAction')}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{t('customerPages.timeline.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineList
            items={[
              {
                label: t('customerPages.timeline.step1'),
                detail: t('customerPages.timeline.step1Desc'),
                tone: 'completed',
              },
              {
                label: t('customerPages.timeline.step2'),
                detail: t('customerPages.timeline.step2Desc'),
                tone: 'active',
              },
              {
                label: t('customerPages.timeline.step3'),
                detail: t('customerPages.timeline.step3Desc'),
              },
            ]}
          />
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

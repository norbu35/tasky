import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerStatsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell title={t('taskerPages.stats.title', 'Tasker stats')} description={t('taskerPages.stats.description', 'View a concise performance summary.')}>
      <Card>
        <CardContent className="grid gap-3 p-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>{t('taskerPages.stats.content1', 'Completion rate, rating, and response time stay visible for taskers.')}</p>
          <p>{t('taskerPages.stats.content2', 'Phase 1 keeps the stats surface lightweight and auditable.')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

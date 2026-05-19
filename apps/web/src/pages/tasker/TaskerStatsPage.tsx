import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function TaskerStatsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.stats.title')}
      description={t('taskerPages.stats.description')}
    >
      <Card>
        <CardContent className="grid gap-3 p-6 text-sm text-muted-foreground md:grid-cols-2">
          <p>{t('taskerPages.stats.content1')}</p>
          <p>{t('taskerPages.stats.content2')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

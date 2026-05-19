import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function TaskerTaskDetailPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.taskDetail.title')}
      description={t('taskerPages.taskDetail.description')}
    >
      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p>{t('taskerPages.taskDetail.content1')}</p>
          <p>{t('taskerPages.taskDetail.content2')}</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

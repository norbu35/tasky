import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function TaskerTaskDetailPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.taskDetail.title', 'Task detail')}
      description={t(
        'taskerPages.taskDetail.description',
        'Review the public task before applying.',
      )}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'taskerPages.taskDetail.content1',
              'Task summary, budget, and approximate location are shown here.',
            )}
          </p>
          <p>
            {t(
              'taskerPages.taskDetail.content2',
              'Manual verification stays intact for Phase 0-1 tasker access.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveDetailShell } from '../../layout/parity/ResponsiveDetailShell';

export function TaskerJobsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailShell
      title={t('taskerPages.jobs.title', 'My Jobs')}
      description={t(
        'taskerPages.jobs.description',
        'Track active and completed work in one place.',
      )}
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            {t(
              'taskerPages.jobs.content',
              'Active bookings and recent completed jobs appear here in Phase 1.',
            )}
          </p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}

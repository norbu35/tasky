import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveWizardShell } from '../../layout/parity';

export function TaskerApplicationSentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ResponsiveWizardShell
      title={t('taskerPages.applicationSent.title')}
      description={t('taskerPages.applicationSent.description')}
      footer={
        <Button type="button" onClick={() => navigate('/tasker/tasks')}>
          {t('taskerPages.applicationSent.backAction')}
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            {t('taskerPages.applicationSent.content')}
          </p>
        </CardContent>
      </Card>
    </ResponsiveWizardShell>
  );
}

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ResponsiveWizardShell } from '../../components/parity';

export function TaskerApplicationSentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ResponsiveWizardShell
      title={t('taskerPages.applicationSent.title', 'Application sent')}
      description={t('taskerPages.applicationSent.description', 'Your application has been sent to the customer and is waiting for review.')}
      footer={
        <Button type="button" onClick={() => navigate('/tasker/tasks')}>
          {t('taskerPages.applicationSent.backAction', 'Back to feed')}
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">{t('taskerPages.applicationSent.content', 'Application sent.')}</p>
        </CardContent>
      </Card>
    </ResponsiveWizardShell>
  );
}

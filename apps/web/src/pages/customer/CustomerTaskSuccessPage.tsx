import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { ResponsiveWizardShell, StatePanel } from '../../layout/parity';

export function CustomerTaskSuccessPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveWizardShell
      title={t('customerPages.taskSuccess.title')}
      description={t('customerPages.taskSuccess.description')}
      stepLabel={t('customerPages.taskSuccess.stepLabel')}
      footer={
        <div className="flex flex-wrap gap-3">
          <Button type="button">{t('customerPages.taskSuccess.backToTasks')}</Button>
          <Button type="button" variant="secondary">
            {t('customerPages.taskSuccess.postAnother')}
          </Button>
        </div>
      }
    >
      <StatePanel
        icon={<CheckCircle2 className="h-5 w-5 text-status-completed" />}
        title={t('customerPages.taskSuccess.panelTitle')}
        description={t('customerPages.taskSuccess.panelDesc')}
        tone="muted"
      />
    </ResponsiveWizardShell>
  );
}

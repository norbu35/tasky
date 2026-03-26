import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';

import { ResponsiveWizardShell, StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';

export function CustomerTaskSuccessPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveWizardShell
      title={t('customerPages.taskSuccess.title', 'Task posted successfully')}
      description={t('customerPages.taskSuccess.description', 'Your task is live and ready for taskers to review.')}
      stepLabel={t('customerPages.taskSuccess.stepLabel', 'Customer posting complete')}
      footer={
        <div className="flex flex-wrap gap-3">
          <Button type="button">{t('customerPages.taskSuccess.backToTasks', 'Back to tasks')}</Button>
          <Button type="button" variant="secondary">
            {t('customerPages.taskSuccess.postAnother', 'Post another task')}
          </Button>
        </div>
      }
    >
      <StatePanel
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        title={t('customerPages.taskSuccess.panelTitle', 'Task live')}
        description={t('customerPages.taskSuccess.panelDesc', 'Taskers can now browse, review, and apply.')}
        tone="muted"
      />
    </ResponsiveWizardShell>
  );
}

import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

import { StatePanel } from '../../layout/parity';
import { Button } from '../../components/ui/button';

export function CustomerTaskCancelDialog() {
  const { t } = useTranslation();

  return (
    <StatePanel
      icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
      title={t('customerPages.taskCancel.title', 'Cancel task?')}
      description={t(
        'customerPages.taskCancel.description',
        'Stopping this task will remove it from the active customer flow.',
      )}
      tone="warning"
      actions={
        <>
          <Button type="button" variant="secondary">
            {t('customerPages.taskCancel.keepAction', 'Keep task')}
          </Button>
          <Button type="button" variant="destructive">
            {t('customerPages.taskCancel.cancelAction', 'Cancel task')}
          </Button>
        </>
      }
    />
  );
}

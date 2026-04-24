import { RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResponsiveFeedShell, StatePanel } from '../../layout/parity';

export function AppUpdatePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.appUpdate.title')}
      description={t('sharedPages.appUpdate.description')}
    >
      <StatePanel
        title={t('sharedPages.appUpdate.panelTitle')}
        description={t('sharedPages.appUpdate.panelDesc')}
        icon={<RefreshCcw className="h-4 w-4" />}
        tone="muted"
      />
    </ResponsiveFeedShell>
  );
}

import { useTranslation } from 'react-i18next';
import { RefreshCcw } from 'lucide-react';

import { ResponsiveFeedShell, StatePanel } from '../../components/parity';

export function AppUpdatePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.appUpdate.title', 'App update available')}
      description={t(
        'sharedPages.appUpdate.description',
        'Refresh the web client to get the latest stability fixes and marketplace updates.',
      )}
    >
      <StatePanel
        title={t('sharedPages.appUpdate.panelTitle', 'New version ready')}
        description={t(
          'sharedPages.appUpdate.panelDesc',
          'Reload the app after you finish any active form or chat work.',
        )}
        icon={<RefreshCcw className="h-4 w-4" />}
        tone="muted"
      />
    </ResponsiveFeedShell>
  );
}

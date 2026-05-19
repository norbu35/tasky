import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResponsiveFeedShell, StatePanel } from '../../layout/parity';

export function NotificationsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.notifications.title')}
      description={t('sharedPages.notifications.description')}
    >
      <StatePanel
        title={t('sharedPages.notifications.emptyTitle')}
        description={t('sharedPages.notifications.emptyDesc')}
        icon={<Bell className="h-5 w-5" />}
        tone="muted"
      />
    </ResponsiveFeedShell>
  );
}

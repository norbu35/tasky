import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { ResponsiveFeedShell, StatePanel } from '../../layout/parity';

export function NotificationsPage() {
  const { t } = useTranslation();

  return (
    <ResponsiveFeedShell
      title={t('sharedPages.notifications.title', 'Notifications')}
      description={t(
        'sharedPages.notifications.description',
        'Important updates across bookings, disputes, and reviews.',
      )}
    >
      <StatePanel
        title={t('sharedPages.notifications.emptyTitle', 'All caught up')}
        description={t('sharedPages.notifications.emptyDesc', 'You are all caught up for now.')}
        icon={<Bell className="h-4 w-4" />}
        tone="muted"
      />
    </ResponsiveFeedShell>
  );
}

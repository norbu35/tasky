import { Bell } from 'lucide-react';
import { ResponsiveFeedShell, StatePanel } from '../../components/parity';

export function NotificationsPage() {
  return (
    <ResponsiveFeedShell title="Notifications" description="Important updates across bookings, disputes, and reviews.">
      <StatePanel
        title="All caught up"
        description="You are all caught up for now."
        icon={<Bell className="h-4 w-4" />}
        tone="muted"
      />
    </ResponsiveFeedShell>
  );
}

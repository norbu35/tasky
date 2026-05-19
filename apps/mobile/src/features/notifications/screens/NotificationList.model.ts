import type { Notification } from '@/features/notifications/hooks/useNotifications';

export type Row =
  | { type: 'section'; id: string; label: string }
  | { type: 'notification'; id: string; notification: Notification };

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function buildRows(
  notifications: Notification[],
  todayLabel: string,
  earlierLabel: string,
): Row[] {
  if (notifications.length === 0) return [];

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const anchorDate = new Date(sorted[0].created_at);

  const today = sorted.filter((item) => isSameDay(new Date(item.created_at), anchorDate));
  const earlier = sorted.filter((item) => !isSameDay(new Date(item.created_at), anchorDate));

  const rows: Row[] = [];

  if (today.length > 0) {
    rows.push({ type: 'section', id: 'today', label: todayLabel });
    rows.push(
      ...today.map((notification) => ({
        type: 'notification' as const,
        id: notification.id,
        notification,
      })),
    );
  }

  if (earlier.length > 0) {
    rows.push({ type: 'section', id: 'earlier', label: earlierLabel });
    rows.push(
      ...earlier.map((notification) => ({
        type: 'notification' as const,
        id: notification.id,
        notification,
      })),
    );
  }

  return rows;
}

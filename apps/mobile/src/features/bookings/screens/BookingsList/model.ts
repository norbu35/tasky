import type { StatusType } from '@/components/ui/StatusBadge';

export type BookingTab = 'active' | 'completed';

export const TAB_IDS: BookingTab[] = ['active', 'completed'];

export function formatSchedule(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

export function getBookingStatusLabel(
  status: string | undefined,
  t: (key: string) => string,
): string {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return t('BookingsListScreen.assigned');
    case 'COMPLETED':
      return t('BookingsListScreen.completed');
    case 'CANCELLED':
      return t('BookingsListScreen.cancelled');
    case 'NO_SHOW':
      return t('BookingsListScreen.noShow');
    default:
      return t('BookingsListScreen.pending');
  }
}

export function mapBookingStatus(status?: string): StatusType {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
    case 'TASKER_MARKED_DONE':
      return 'assigned';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'NO_SHOW':
      return 'no_show';
    default:
      return 'open';
  }
}

export function isActiveStatus(status?: string): boolean {
  return (status ?? '').toUpperCase() === 'ASSIGNED';
}

export function isCompletedStatus(status?: string): boolean {
  const upper = (status ?? '').toUpperCase();
  return upper === 'COMPLETED' || upper === 'CANCELLED' || upper === 'NO_SHOW';
}

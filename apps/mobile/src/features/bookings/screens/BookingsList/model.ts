import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

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

export function getBookingStatusColors(status?: string): { bg: string; text: string } {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return { bg: colors.statusAssigned, text: colors.statusAssignedForeground };
    case 'COMPLETED':
      return { bg: colors.verified, text: colors.verifiedForeground };
    case 'CANCELLED':
      return { bg: colors.muted, text: colors.textSecondary };
    case 'NO_SHOW':
      return { bg: colors.danger, text: colors.dangerForeground };
    default:
      return { bg: colors.secondary, text: colors.secondaryForeground };
  }
}

export function isActiveStatus(status?: string): boolean {
  return (status ?? '').toUpperCase() === 'ASSIGNED';
}

export function isCompletedStatus(status?: string): boolean {
  const upper = (status ?? '').toUpperCase();
  return upper === 'COMPLETED' || upper === 'CANCELLED' || upper === 'NO_SHOW';
}

export interface TimelineEvent {
  event: string;
  timestamp: string;
  description?: string | null;
  is_future?: boolean;
}

export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

export function getEventLabel(event: string, t: (key: string) => string): string {
  switch (event) {
    case 'booking_created':
      return t('BookingTimelineScreen.copy1');
    case 'tasker_assigned':
      return t('BookingTimelineScreen.copy2');
    case 'reschedule_requested':
      return t('BookingTimelineScreen.copy3');
    case 'reschedule_accepted':
      return t('BookingTimelineScreen.copy4');
    case 'reschedule_declined':
      return t('BookingTimelineScreen.copy5');
    case 'reschedule_expired':
      return t('BookingTimelineScreen.copy6');
    case 'tasker_marked_done':
      return t('BookingTimelineScreen.copy7');
    case 'customer_confirmed':
      return t('BookingTimelineScreen.copy8');
    case 'cancelled':
      return t('BookingTimelineScreen.copy9');
    case 'no_show':
      return t('BookingTimelineScreen.copy10');
    default:
      return event;
  }
}

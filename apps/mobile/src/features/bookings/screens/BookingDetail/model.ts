import { type Booking } from '@/lib/api/types';
import { type CancelType } from '@/features/bookings/components/CustomerCancelSheet';
import { mapStatus as sharedMapStatus } from '@/utils/statusMapping';

export interface CustomerBooking extends Omit<Booking, 'status' | 'customer'> {
  status: Booking['status'] | 'TASKER_MARKED_DONE';
  customer_review_submitted_at?: string;
  review_submitted_at?: string;
  review?: { submitted_at?: string };
  customer_incidents_28d?: number;
  incidents_28d?: number;
  customer?: { incidents_28d?: number } & Booking['customer'];
}

export function mapStatus(
  status: string,
): 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show' {
  return sharedMapStatus(status);
}

export function getStatusLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'ASSIGNED':
      return t('customer.bookings.statusAssigned');
    case 'TASKER_MARKED_DONE':
      return t('customer.bookings.statusMarkedDone');
    case 'COMPLETED':
      return t('customer.bookings.statusCompleted');
    case 'CANCELLED':
      return t('customer.bookings.statusCancelled');
    case 'NO_SHOW':
      return t('customer.bookings.statusNoShow');
    default:
      return status;
  }
}

export function getCtaConfig(
  booking: CustomerBooking | undefined,
  t: (key: string) => string,
): { label: string; action: string } | null {
  switch (booking?.status) {
    case 'ASSIGNED':
      return { label: t('customer.bookings.ctaMessage'), action: 'message' };
    case 'TASKER_MARKED_DONE':
      return {
        label: t('customer.bookings.ctaConfirmComplete'),
        action: 'confirm_complete',
      };
    case 'COMPLETED':
      return hasSubmittedReview(booking)
        ? { label: t('customer.bookings.ctaRebook'), action: 'rebook' }
        : { label: t('customer.bookings.ctaLeaveReview'), action: 'leave_review' };
    default:
      return null;
  }
}

export function hasSubmittedReview(booking: CustomerBooking | undefined): boolean {
  return Boolean(
    booking?.customer_review_submitted_at ??
    booking?.review_submitted_at ??
    booking?.review?.submitted_at,
  );
}

export function getCancelType(booking: CustomerBooking | undefined): CancelType {
  const scheduledAt = booking?.task?.scheduled_at;
  if (!scheduledAt) return 'free_cancel';

  const fourHoursMs = 4 * 60 * 60 * 1000;
  const timeUntilScheduled = new Date(scheduledAt).getTime() - Date.now();
  if (timeUntilScheduled >= fourHoursMs) {
    return 'free_cancel';
  }

  const recentIncidents =
    booking?.customer_incidents_28d ??
    booking?.customer?.incidents_28d ??
    booking?.incidents_28d ??
    0;
  return recentIncidents > 0 ? 'late_cancel_incident_count' : 'late_cancel_warning';
}

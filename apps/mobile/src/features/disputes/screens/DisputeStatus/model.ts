import { formatDateTime, formatFullDate } from '@/utils/formatDate';

export type DisputeStatus =
  | 'EVIDENCE_NEEDED'
  | 'OPEN'
  | 'ESCALATED'
  | 'RESOLVED_CUSTOMER'
  | 'RESOLVED_TASKER'
  | 'CLOSED_INSUFFICIENT_EVIDENCE';

export type TimelineState = 'done' | 'current' | 'future';

export type DisputeLike = {
  id: string;
  booking_id: string;
  reason: string;
  status: DisputeStatus | string;
  evidence?: (
    | string
    | { type: string; text_payload?: string | null; storage_key?: string | null }
  )[];
  created_at: string;
  resolved_at?: string | null;
  booking?: {
    id: string;
    confirmed_scheduled_at: string;
    price: number;
    task?: {
      category?: { name?: string | null } | null;
      title?: string | null;
      description?: string | null;
    } | null;
  } | null;
};

export function getStatus(status?: string): DisputeStatus {
  switch (status) {
    case 'EVIDENCE_NEEDED':
      return 'EVIDENCE_NEEDED';
    case 'ESCALATED':
      return 'ESCALATED';
    case 'RESOLVED_CUSTOMER':
      return 'RESOLVED_CUSTOMER';
    case 'RESOLVED_TASKER':
      return 'RESOLVED_TASKER';
    case 'CLOSED_INSUFFICIENT':
    case 'CLOSED_INSUFFICIENT_EVIDENCE':
      return 'CLOSED_INSUFFICIENT_EVIDENCE';
    case 'OPEN':
    default:
      return 'OPEN';
  }
}

export function buildStatusMeta(t: (key: string) => string): Record<
  DisputeStatus,
  {
    label: string;
    description: string;
    resolutionText: string;
    badgeStyle: 'warning' | 'success' | 'neutral' | 'danger';
  }
> {
  return {
    EVIDENCE_NEEDED: {
      label: t('customer.disputes.statusEvidenceNeeded'),
      description: t('customer.disputes.evidenceNeededDescription'),
      resolutionText: t('customer.disputes.resolutionEvidenceNeeded'),
      badgeStyle: 'warning',
    },
    OPEN: {
      label: t('customer.disputes.statusOpen'),
      description: t('customer.disputes.openDescription'),
      resolutionText: t('customer.disputes.resolutionOpen'),
      badgeStyle: 'warning',
    },
    ESCALATED: {
      label: t('customer.disputes.statusEscalated'),
      description: t('customer.disputes.escalatedDescription'),
      resolutionText: t('customer.disputes.resolutionEscalated'),
      badgeStyle: 'warning',
    },
    RESOLVED_CUSTOMER: {
      label: t('customer.disputes.statusResolvedCustomer'),
      description: t('customer.disputes.resolvedCustomerDescription'),
      resolutionText: t('customer.disputes.resolutionResolvedCustomer'),
      badgeStyle: 'success',
    },
    RESOLVED_TASKER: {
      label: t('customer.disputes.statusResolvedTasker'),
      description: t('customer.disputes.resolvedTaskerDescription'),
      resolutionText: t('customer.disputes.resolutionResolvedTasker'),
      badgeStyle: 'neutral',
    },
    CLOSED_INSUFFICIENT_EVIDENCE: {
      label: t('customer.disputes.statusClosedInsufficient'),
      description: t('customer.disputes.closedInsufficientDescription'),
      resolutionText: t('customer.disputes.resolutionClosedInsufficient'),
      badgeStyle: 'danger',
    },
  };
}

export function formatMongolianDate(
  date: Date,
  _t: (key: string) => string,
  options?: { includeTime?: boolean },
): string {
  if (options?.includeTime) {
    return formatDateTime(date);
  }
  return formatFullDate(date);
}

export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getTimelineState(status: DisputeStatus, index: number): TimelineState {
  if (index === 0) return 'done';
  if (index === 1) return 'done';
  if (index === 2) {
    return status === 'OPEN' || status === 'ESCALATED' ? 'current' : 'done';
  }
  return 'future';
}

export const DISPUTE_STATUS_SURFACE = {
  timeline: {
    dotSize: 24,
    innerDotSize: 8,
    lineWidth: 2,
    resolutionIconBox: 64,
    evidenceBullet: 8,
    decorativeScaleHeight: 192,
  },
} as const;

export function getEvidenceLabel(
  item: string | { type: string; text_payload?: string | null; storage_key?: string | null },
  t: (key: string) => string,
) {
  if (typeof item === 'string') return item;
  if (item.text_payload) return item.text_payload;
  switch (item.type) {
    case 'PHOTO':
      return t('customer.disputes.evidencePhoto');
    case 'CHAT_EXCERPT':
      return t('customer.disputes.evidenceChatExcerpt');
    case 'WRITTEN_TIMELINE':
      return t('customer.disputes.evidenceWrittenTimeline');
    default:
      return item.storage_key ?? t('customer.disputes.evidenceFallback');
  }
}

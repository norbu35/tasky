import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';
import { useDisputeDetail } from '@/features/disputes/hooks/useDisputeDetail';

import {
  type DisputeLike,
  type DisputeStatus,
  buildStatusMeta,
  formatMongolianDate,
  getStatus,
  parseDate,
} from './model';

const { spacing } = mobileTheme;

export function useDisputeStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { disputeId } = useLocalSearchParams<{ disputeId: string }>();
  const { data: disputeData, isLoading, isError, refetch } = useDisputeDetail(disputeId);

  const dispute = disputeData as DisputeLike | undefined;
  const status: DisputeStatus = getStatus(dispute?.status);
  const meta = buildStatusMeta(t)[status];
  const booking = dispute?.booking;
  const bookingCategory = booking?.task?.category?.name ?? t('customer.disputes.defaultCategory');
  const bookingReference = booking?.id ?? dispute?.booking_id ?? disputeId ?? '—';
  const submittedAt = parseDate(dispute?.created_at);

  const timeline = React.useMemo(
    () => [
      {
        title: t('customer.disputes.timelineSubmitted'),
        description: t('customer.disputes.timelineSubmittedDesc'),
        date: submittedAt ? formatMongolianDate(submittedAt, t) : '2024.05.20',
      },
      {
        title: t('customer.disputes.timelineAssigned'),
        description: t('customer.disputes.timelineAssignedDesc'),
        date: submittedAt ? formatMongolianDate(submittedAt, t) : '2024.05.21',
      },
      {
        title: t('customer.disputes.timelineDecision'),
        description: meta.resolutionText,
        date: dispute?.resolved_at
          ? formatMongolianDate(parseDate(dispute.resolved_at) ?? new Date(), t)
          : undefined,
      },
    ],
    [dispute?.resolved_at, meta.resolutionText, submittedAt, t],
  );

  const scrollContentStyle = {
    paddingHorizontal: screenLayout.insetX,
    paddingTop: screenLayout.body.blockGap,
    paddingBottom: spacing['2xl'],
    gap: screenLayout.body.blockGap,
  };

  return {
    t,
    router,
    dispute,
    disputeId,
    status,
    meta,
    bookingCategory,
    bookingReference: String(bookingReference).slice(0, 8).toUpperCase(),
    submittedAt,
    submittedAtLabel: submittedAt
      ? formatMongolianDate(submittedAt, t)
      : t('customer.disputes.submittedDateFallback'),
    timeline,
    evidenceItems: Array.isArray(dispute?.evidence) ? dispute!.evidence : [],
    isLoading,
    isError,
    refetch,
    scrollContentStyle,
    screenLayout,
    spacing,
  };
}

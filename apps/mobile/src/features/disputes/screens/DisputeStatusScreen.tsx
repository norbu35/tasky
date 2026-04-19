import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ChevronLeft,
  CircleCheckBig,
  CircleAlert,
  Circle,
  Scale,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { cn } from '@/lib/cn';
import { useDisputeDetail } from '../hooks/useDisputeDetail';

const { colors, spacing } = mobileTheme;
const { tint } = mobileSurfaces;
const DISPUTE_STATUS_SURFACE = {
  timeline: {
    dotSize: 24,
    innerDotSize: 8,
    lineWidth: 2,
    resolutionIconBox: 64,
    evidenceBullet: 8,
    decorativeScaleHeight: 192,
  },
} as const;

type DisputeStatus =
  | 'OPEN'
  | 'ESCALATED'
  | 'RESOLVED_CUSTOMER'
  | 'RESOLVED_TASKER'
  | 'CLOSED_INSUFFICIENT_EVIDENCE';

type DisputeLike = {
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

type TimelineState = 'done' | 'current' | 'future';

function buildStatusMeta(t: (key: string) => string): Record<
  DisputeStatus,
  {
    label: string;
    description: string;
    resolutionText: string;
    badgeStyle: 'warning' | 'success' | 'neutral' | 'danger';
  }
> {
  return {
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

function getDisputeMonths(t: (key: string) => string) {
  return [
    t('customer.disputes.months.january'),
    t('customer.disputes.months.february'),
    t('customer.disputes.months.march'),
    t('customer.disputes.months.april'),
    t('customer.disputes.months.may'),
    t('customer.disputes.months.june'),
    t('customer.disputes.months.july'),
    t('customer.disputes.months.august'),
    t('customer.disputes.months.september'),
    t('customer.disputes.months.october'),
    t('customer.disputes.months.november'),
    t('customer.disputes.months.december'),
  ];
}

function formatMongolianDate(
  date: Date,
  t: (key: string) => string,
  options?: { includeTime?: boolean },
): string {
  const months = getDisputeMonths(t);
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();
  if (options?.includeTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(day).padStart(2, '0')} ${hours}:${minutes}`;
  }
  return `${year} оны ${month} ${day}`;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStatus(status?: string): DisputeStatus {
  switch (status) {
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

function getTimelineState(status: DisputeStatus, index: number): TimelineState {
  if (index === 0) return 'done';
  if (index === 1) return 'done';
  if (index === 2) {
    return status === 'OPEN' || status === 'ESCALATED' ? 'current' : 'done';
  }
  return 'future';
}

function getEvidenceLabel(
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

function TimelineDot({ state }: { state: TimelineState }) {
  if (state === 'done') {
    return (
      <View
        testID="SCR-CUST-025"
        className="rounded-full bg-primary-deep items-center justify-center border-[4px] border-background"
        style={{
          width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          height: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          zIndex: 2,
        }}
      >
        <CircleCheckBig size={10} color={colors.primaryForeground} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View
        className="rounded-full border-[2px] border-secondary bg-background items-center justify-center"
        style={{
          width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          height: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          zIndex: 2,
        }}
      >
        <View
          className="rounded-full bg-secondary"
          style={{
            width: DISPUTE_STATUS_SURFACE.timeline.innerDotSize,
            height: DISPUTE_STATUS_SURFACE.timeline.innerDotSize,
          }}
        />
      </View>
    );
  }
  return (
    <View
      className="rounded-full border-[2px] border-border bg-background items-center justify-center"
      style={{
        width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
        height: DISPUTE_STATUS_SURFACE.timeline.dotSize,
        zIndex: 2,
      }}
    >
      <Circle size={8} color={colors.border} fill={colors.border} />
    </View>
  );
}

export default function DisputeStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { disputeId } = useLocalSearchParams<{ disputeId: string }>();
  const { data: disputeData, isLoading, isError, refetch } = useDisputeDetail(disputeId);

  const dispute = disputeData as DisputeLike | undefined;
  const status = getStatus(dispute?.status);
  const meta = buildStatusMeta(t)[status];
  const booking = dispute?.booking;
  const bookingCategory = booking?.task?.category?.name ?? t('customer.disputes.defaultCategory');
  const bookingReference = booking?.id ?? dispute?.booking_id ?? disputeId ?? '—';
  const submittedAt = parseDate(dispute?.created_at);
  const evidenceItems = Array.isArray(dispute?.evidence) ? dispute.evidence : [];

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

  return (
    <ScreenContainer testID="dispute-status-screen">
      <View
        className="flex-row items-center justify-between pb-micro"
        style={{ minHeight: screenLayout.header.minHeight }}
      >
        <Touchable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="w-3xl h-3xl items-start justify-center"
          hitSlop={spacing.sm}
          testID="dispute-status-back"
        >
          <ChevronLeft size={20} color={colors.primary} />
        </Touchable>
        <Text className="flex-1 text-subtitle font-sans-bold text-primary-deep text-center mx-sm">
          {t('customer.disputes.pageTitle')}
        </Text>
        <View className="w-3xl" />
      </View>
      <InsetScrollView
        contentContainerStyle={{
          paddingHorizontal: screenLayout.insetX,
          paddingTop: screenLayout.body.blockGap,
          paddingBottom: spacing['2xl'],
          gap: screenLayout.body.blockGap,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        extraBottomInset={spacing.xl}
      >
        {isLoading ? (
          <View className="items-center justify-center py-3xl">
            <ActivityIndicator size="small" color={colors.primaryDeep} />
          </View>
        ) : isError ? (
          <View className="bg-card rounded-lg p-lg items-center gap-sm">
            <CircleAlert size={24} color={colors.danger} />
            <Text className="text-body text-primary-deep text-center leading-relaxed">
              {t('customer.disputes.errorToast')}
            </Text>
            <Touchable
              onPress={() => void refetch()}
              className="px-lg py-sm rounded-md border border-primary-deep"
            >
              <Text className="text-body text-primary-deep font-sans-bold">
                {t('customer.disputes.retry')}
              </Text>
            </Touchable>
          </View>
        ) : dispute ? (
          <>
            <View className="items-center gap-sm">
              <View className="items-center pb-xs">
                <View
                  className={cn(
                    'rounded-full px-md py-xs items-center justify-center',
                    meta.badgeStyle === 'warning' && 'bg-status-open',
                    meta.badgeStyle === 'success' && 'bg-status-assigned',
                    meta.badgeStyle === 'neutral' && 'bg-muted',
                    meta.badgeStyle === 'danger' && 'bg-danger',
                  )}
                >
                  <Text
                    className={cn(
                      'text-label font-sans-bold tracking-wide',
                      meta.badgeStyle === 'warning' && 'text-status-open-foreground',
                      meta.badgeStyle === 'success' && 'text-status-assigned-foreground',
                      meta.badgeStyle === 'neutral' && 'text-primary-deep',
                      meta.badgeStyle === 'danger' && 'text-primary-foreground',
                    )}
                  >
                    {meta.label}
                  </Text>
                </View>
              </View>
              <Text className="text-body text-text-secondary text-center px-md leading-loose">
                {meta.description}
              </Text>
            </View>

            <View className="bg-muted rounded-lg p-lg gap-item">
              <Text className="text-heading font-sans-bold text-primary-deep">
                {t('customer.disputes.sectionSummary')}
              </Text>
              <View className="gap-xs">
                <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
                  {t('customer.disputes.detailType')}
                </Text>
                <Text className="text-body font-sans-bold text-primary-deep leading-snug">
                  {bookingCategory}
                </Text>
              </View>
              <View className="gap-xs">
                <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
                  {t('customer.disputes.detailBooking')}
                </Text>
                <Text className="text-body font-sans-bold text-primary-deep leading-snug">
                  {String(bookingReference).slice(0, 8).toUpperCase()}
                </Text>
              </View>
              <View className="gap-xs" style={{ paddingBottom: spacing.xs / 2 }}>
                <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
                  {t('customer.disputes.detailSubmitted')}
                </Text>
                <Text className="text-body font-sans-bold text-primary-deep leading-snug">
                  {submittedAt
                    ? formatMongolianDate(submittedAt, t)
                    : t('customer.disputes.submittedDateFallback')}
                </Text>
              </View>
              <View className="gap-xs">
                <Text className="text-caption text-text-secondary uppercase tracking-[0.075em]">
                  {t('customer.disputes.detailReason')}
                </Text>
                <Text className="text-body font-sans-bold text-primary-deep leading-snug">
                  {dispute.reason}
                </Text>
              </View>
            </View>

            <View className="gap-lg">
              <Text className="text-heading font-sans-bold text-primary-deep">
                {t('customer.disputes.sectionProcess')}
              </Text>
              <View className="gap-lg" style={{ position: 'relative' }}>
                {timeline.map((item, index) => {
                  const state = getTimelineState(status, index);
                  const isLast = index === timeline.length - 1;
                  return (
                    <View key={item.title} className="flex-row gap-item">
                      <View
                        className="items-center"
                        style={{
                          width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
                          position: 'relative',
                        }}
                      >
                        <TimelineDot state={state} />
                        {!isLast ? (
                          <View
                            className="absolute"
                            style={{
                              width: DISPUTE_STATUS_SURFACE.timeline.lineWidth,
                              top: DISPUTE_STATUS_SURFACE.timeline.dotSize,
                              bottom: -spacing.lg,
                              backgroundColor: tint.borderSoft,
                            }}
                          />
                        ) : null}
                      </View>
                      <View className="flex-1 gap-xs pb-item">
                        <Text
                          className={cn(
                            'text-body font-sans-bold text-primary-deep',
                            state === 'future' && 'text-text-secondary',
                          )}
                        >
                          {item.title}
                        </Text>
                        <Text
                          className={cn(
                            'text-body text-text-secondary leading-normal',
                            state === 'future' && 'text-text-tertiary',
                          )}
                        >
                          {item.description}
                        </Text>
                        {item.date ? (
                          <View className="self-start rounded-sm bg-muted px-sm py-xs">
                            <Text className="text-caption text-text-secondary">{item.date}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="bg-muted rounded-lg p-lg gap-item">
              <Text className="text-heading font-sans-bold text-primary-deep">
                {t('customer.disputes.sectionResolution')}
              </Text>
              <View className="items-center gap-sm">
                <View
                  className="rounded-lg bg-chip-inactive items-center justify-center"
                  style={{
                    width: DISPUTE_STATUS_SURFACE.timeline.resolutionIconBox,
                    height: DISPUTE_STATUS_SURFACE.timeline.resolutionIconBox,
                  }}
                >
                  <AlertTriangle size={20} color={colors.secondary} />
                </View>
                <Text className="text-body font-sans-bold text-primary-deep text-center">
                  {meta.label}
                </Text>
                <Text className="text-body text-text-secondary text-center leading-normal">
                  {meta.resolutionText}
                </Text>
              </View>
            </View>

            <View className="bg-muted rounded-lg p-lg">
              <Text className="text-body text-text-secondary text-center leading-normal">
                {t('customer.disputes.phase1Note')}
              </Text>
            </View>

            <View className="bg-card rounded-lg p-lg gap-sm" style={elevations.soft}>
              <Text className="text-heading font-sans-bold text-primary-deep">
                {t('customer.disputes.sectionEvidence')}
              </Text>
              {evidenceItems.length > 0 ? (
                evidenceItems.map((item, index) => (
                  <View
                    key={`${index}-${typeof item === 'string' ? item : item.type}-${typeof item === 'string' ? 'string' : (item.storage_key ?? 'item')}`}
                    className="flex-row items-start gap-sm"
                  >
                    <View
                      className="rounded-full bg-primary-deep mt-sm"
                      style={{
                        width: DISPUTE_STATUS_SURFACE.timeline.evidenceBullet,
                        height: DISPUTE_STATUS_SURFACE.timeline.evidenceBullet,
                      }}
                    />
                    <Text className="flex-1 text-body text-primary-deep leading-snug">
                      {getEvidenceLabel(item, t)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-body text-text-secondary">
                  {t('customer.disputes.noEvidence')}
                </Text>
              )}
            </View>

            <View
              className="rounded-lg overflow-hidden items-center justify-center"
              style={{
                height: DISPUTE_STATUS_SURFACE.timeline.decorativeScaleHeight,
                opacity: 0.4,
              }}
            >
              <Scale size={24} color={colors.textSecondary} />
            </View>
          </>
        ) : null}
      </InsetScrollView>
    </ScreenContainer>
  );
}

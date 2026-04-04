import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CircleCheckBig,
  CircleAlert,
  Circle,
} from 'lucide-react-native';
import { InsetScrollView, ScreenContainer } from '../../../../components/shells';
import { useDisputeDetail } from '../../../../features/disputes/hooks/useDisputeDetail';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { elevations } from '../../../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

const imgDisputeDecorative =
  'https://www.figma.com/api/mcp/asset/bc24413e-83d2-4bf1-8f8d-ca5ab7389b01';

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
  evidence?: (string | { type: string; text_payload?: string | null; storage_key?: string | null })[];
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

const STATUS_META: Record<
  DisputeStatus,
  { label: string; description: string; badgeStyle: 'warning' | 'success' | 'neutral' | 'danger' }
> = {
  OPEN: {
    label: 'Нээлттэй',
    description: 'Таны маргаан админы хянаж байна. Шийдвэр гарахад мэдэгдэл авна.',
    badgeStyle: 'warning',
  },
  ESCALATED: {
    label: 'Мөрдөн шалгаж байна',
    description: 'Маргааныг нэмэлт шалгалтад шилжүүлсэн. Удахгүй хариу өгнө.',
    badgeStyle: 'warning',
  },
  RESOLVED_CUSTOMER: {
    label: 'Хэрэглэгчийн талд шийдэгдсэн',
    description: 'Маргаан таны талд шийдэгдлээ. Нөгөө талд зөрчлийн тэмдэглэл хийгдсэн.',
    badgeStyle: 'success',
  },
  RESOLVED_TASKER: {
    label: 'Гүйцэтгэгчийн талд шийдэгдсэн',
    description: 'Маргаан гүйцэтгэгчийн талд шийдэгдлээ.',
    badgeStyle: 'neutral',
  },
  CLOSED_INSUFFICIENT_EVIDENCE: {
    label: 'Нотлох баримт хангалтгүй — хаагдсан',
    description: 'Нотлох баримт 24 цагийн дотор ирүүлээгүй тул маргаан хаагдлаа.',
    badgeStyle: 'danger',
  },
};

function formatMongolianDate(date: Date, options?: { includeTime?: boolean }): string {
  const months = [
    '1-р сар',
    '2-р сар',
    '3-р сар',
    '4-р сар',
    '5-р сар',
    '6-р сар',
    '7-р сар',
    '8-р сар',
    '9-р сар',
    '10-р сар',
    '11-р сар',
    '12-р сар',
  ];
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
  if (index === 1) return status === 'OPEN' ? 'done' : 'done';
  if (index === 2) {
    return status === 'OPEN' || status === 'ESCALATED' ? 'current' : 'done';
  }
  return 'future';
}

function getResolutionText(
  status: DisputeStatus,
  t: (key: string, fallback: string) => string,
): string {
  switch (status) {
    case 'ESCALATED':
      return t('customer.disputes.resolutionEscalated', 'Маргааныг нэмэлт шалгалтад шилжүүлсэн.');
    case 'RESOLVED_CUSTOMER':
      return t('customer.disputes.resolutionResolvedCustomer', 'Маргаан таны талд шийдэгдлээ.');
    case 'RESOLVED_TASKER':
      return t(
        'customer.disputes.resolutionResolvedTasker',
        'Маргаан гүйцэтгэгчийн талд шийдэгдлээ.',
      );
    case 'CLOSED_INSUFFICIENT_EVIDENCE':
      return t(
        'customer.disputes.resolutionClosedInsufficient',
        'Нотлох баримт 24 цагийн дотор ирүүлээгүй тул маргаан хаагдлаа.',
      );
    case 'OPEN':
    default:
      return t('customer.disputes.resolutionOpen', 'Маргаан одоогоор хянагдаж байна.');
  }
}

function getEvidenceLabel(
  item: string | { type: string; text_payload?: string | null; storage_key?: string | null },
) {
  if (typeof item === 'string') return item;
  if (item.text_payload) return item.text_payload;
  switch (item.type) {
    case 'PHOTO':
      return 'Зураг';
    case 'CHAT_EXCERPT':
      return 'Чат хэсэг';
    case 'WRITTEN_TIMELINE':
      return 'Бичмэл таймлайн';
    default:
      return item.storage_key ?? 'Нотлох баримт';
  }
}

function TimelineDot({ state }: { state: TimelineState }) {
  if (state === 'done') {
    return (
      <View style={styles.timelineDotDone}>
        <CircleCheckBig size={10} color={colors.primaryForeground} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View style={styles.timelineDotCurrent}>
        <View style={styles.timelineDotCurrentInner} />
      </View>
    );
  }
  return (
    <View style={styles.timelineDotFuture}>
      <Circle size={8} color={colors.border} fill={colors.border} />
    </View>
  );
}

export default function DisputeStatusScreen() {
  const { t } = useTranslation();
  const { disputeId } = useLocalSearchParams<{ disputeId: string }>();
  const { data: disputeData, isLoading, isError, refetch } = useDisputeDetail(disputeId);

  const dispute = disputeData as DisputeLike | undefined;
  const status = getStatus(dispute?.status);
  const meta = STATUS_META[status];
  const booking = dispute?.booking;
  const bookingCategory =
    booking?.task?.category?.name ?? t('customer.disputes.defaultCategory', 'Чанарын гомдол');
  const bookingReference = booking?.id ?? dispute?.booking_id ?? disputeId ?? '—';
  const submittedAt = parseDate(dispute?.created_at);
  const evidenceItems = Array.isArray(dispute?.evidence) ? dispute.evidence : [];

  const timeline = React.useMemo(
    () => [
      {
        title: t('customer.disputes.timelineSubmitted', 'Маргаан илгээсэн'),
        description: t('customer.disputes.timelineSubmittedDesc', 'Системд амжилттай бүртгэгдсэн'),
        date: submittedAt ? formatMongolianDate(submittedAt) : '2024.05.20',
      },
      {
        title: t('customer.disputes.timelineAssigned', 'Хянагч хуваарилагдсан'),
        description: t(
          'customer.disputes.timelineAssignedDesc',
          'Маргаан хариуцсан мэргэжилтэн томилогдлоо',
        ),
        date: submittedAt ? formatMongolianDate(submittedAt) : '2024.05.21',
      },
      {
        title: t('customer.disputes.timelineDecision', 'Шийдвэр'),
        description: getResolutionText(status, t),
        date: dispute?.resolved_at
          ? formatMongolianDate(parseDate(dispute.resolved_at) ?? new Date())
          : undefined,
      },
    ],
    [dispute?.resolved_at, status, submittedAt, t],
  );

  return (
    <ScreenContainer testID="dispute-status-screen">
        <InsetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          extraBottomInset={spacing.xl}
        >
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.primaryDeep} />
            </View>
          ) : isError ? (
            <View style={styles.errorCard}>
              <CircleAlert size={28} color={colors.danger} />
              <Text style={styles.errorTitle}>
                {t('customer.disputes.errorToast', 'Маргааны мэдээлэл ачааллахад алдаа гарлаа')}
              </Text>
              <Pressable onPress={() => void refetch()} style={styles.retryButton}>
                <Text style={styles.retryLabel}>
                  {t('customer.disputes.retry', 'Дахин оролдох')}
                </Text>
              </Pressable>
            </View>
          ) : dispute ? (
            <>
              <View style={styles.statusHeader}>
                <View style={styles.badgeWrap}>
                  <View
                    style={[
                      styles.statusBadge,
                      meta.badgeStyle === 'warning' && styles.statusBadgeWarning,
                      meta.badgeStyle === 'success' && styles.statusBadgeSuccess,
                      meta.badgeStyle === 'neutral' && styles.statusBadgeNeutral,
                      meta.badgeStyle === 'danger' && styles.statusBadgeDanger,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        meta.badgeStyle === 'warning' && styles.statusBadgeTextWarning,
                        meta.badgeStyle === 'success' && styles.statusBadgeTextSuccess,
                        meta.badgeStyle === 'neutral' && styles.statusBadgeTextNeutral,
                        meta.badgeStyle === 'danger' && styles.statusBadgeTextDanger,
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.statusDescription}>{meta.description}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.cardTitle}>
                  {t('customer.disputes.sectionSummary', 'Маргааны товч')}
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {t('customer.disputes.detailType', 'Төрөл')}
                  </Text>
                  <Text style={styles.summaryValue}>{bookingCategory}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {t('customer.disputes.detailBooking', 'Захиалгын дугаар')}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {String(bookingReference).slice(0, 8).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.summaryRowLast}>
                  <Text style={styles.summaryLabel}>
                    {t('customer.disputes.detailSubmitted', 'Илгээсэн огноо')}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {submittedAt ? formatMongolianDate(submittedAt) : '2024 оны 5-р сарын 20'}
                  </Text>
                </View>
                <View style={styles.summaryReasonWrap}>
                  <Text style={styles.summaryLabel}>
                    {t('customer.disputes.detailReason', 'Гомдлын шалтгаан')}
                  </Text>
                  <Text style={styles.summaryValue}>{dispute.reason}</Text>
                </View>
              </View>

              <View style={styles.timelineSection}>
                <Text style={styles.timelineTitle}>
                  {t('customer.disputes.sectionProcess', 'Үйл явц')}
                </Text>
                <View style={styles.timelineTrack}>
                  {timeline.map((item, index) => {
                    const state = getTimelineState(status, index);
                    const isLast = index === timeline.length - 1;
                    return (
                      <View key={item.title} style={styles.timelineRow}>
                        <View style={styles.timelineRail}>
                          <TimelineDot state={state} />
                          {!isLast ? <View style={styles.timelineConnector} /> : null}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text
                            style={[
                              styles.timelineItemTitle,
                              state === 'future' && styles.timelineItemTitleFuture,
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.timelineItemDescription,
                              state === 'future' && styles.timelineItemDescriptionFuture,
                            ]}
                          >
                            {item.description}
                          </Text>
                          {item.date ? (
                            <View style={styles.timelineDatePill}>
                              <Text style={styles.timelineDateText}>{item.date}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.resolutionCard}>
                <Text style={styles.resolutionTitle}>
                  {t('customer.disputes.sectionResolution', 'Эцсийн шийдвэр')}
                </Text>
                <View style={styles.resolutionInner}>
                  <View style={styles.resolutionIconWrap}>
                    <AlertTriangle size={22} color={colors.secondary} />
                  </View>
                  <Text style={styles.resolutionHeading}>
                    {status === 'OPEN'
                      ? t('customer.disputes.statusOpen', 'Хүлээгдэж байна')
                      : t('customer.disputes.statusFinal', 'Хүлээгдэж байна')}
                  </Text>
                  <Text style={styles.resolutionText}>
                    {t(
                      'customer.disputes.mediationNote',
                      'Маргаан нь зөвхөн зуучлалын шинжтэй. Мөнгөн нөхөн төлбөр олгогдохгүй.',
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.evidenceCard}>
                <Text style={styles.cardTitle}>
                  {t('customer.disputes.sectionEvidence', 'Илгээсэн нотлох баримт')}
                </Text>
                {evidenceItems.length > 0 ? (
                  evidenceItems.map((item, index) => (
                    <View
                      key={`${index}-${typeof item === 'string' ? item : item.type}-${typeof item === 'string' ? 'string' : (item.storage_key ?? 'item')}`}
                      style={styles.evidenceRow}
                    >
                      <View style={styles.evidenceBullet} />
                      <Text style={styles.evidenceText}>{getEvidenceLabel(item)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyEvidence}>
                    {t('customer.disputes.noEvidence', 'Ноотлох баримт байхгүй')}
                  </Text>
                )}
              </View>

              <View style={styles.decorativeImageWrap}>
                <Image source={{ uri: imgDisputeDecorative }} style={styles.decorativeImage} />
              </View>
            </>
          ) : null}
        </InsetScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  errorCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    textAlign: 'center',
    lineHeight: typography.body * 1.4,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryDeep,
  },
  retryLabel: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  statusHeader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeWrap: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeWarning: {
    backgroundColor: colors.statusOpen,
  },
  statusBadgeSuccess: {
    backgroundColor: colors.statusAssigned,
  },
  statusBadgeNeutral: {
    backgroundColor: colors.muted,
  },
  statusBadgeDanger: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    fontSize: typography.label,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusBadgeTextWarning: {
    color: colors.statusOpenForeground,
  },
  statusBadgeTextSuccess: {
    color: colors.statusAssignedForeground,
  },
  statusBadgeTextNeutral: {
    color: colors.primaryDeep,
  },
  statusBadgeTextDanger: {
    color: colors.primaryForeground,
  },
  statusDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  detailCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  summaryRow: {
    gap: spacing.xs,
  },
  summaryRowLast: {
    gap: spacing.xs,
    paddingBottom: 2,
  },
  summaryReasonWrap: {
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
    lineHeight: typography.body * 1.4,
  },
  timelineSection: {
    gap: spacing.lg,
  },
  timelineTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  timelineTrack: {
    gap: spacing.lg,
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    top: 24,
    bottom: -spacing.lg,
    width: 2,
    backgroundColor: 'rgba(195,198,207,0.5)',
  },
  timelineDotDone: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    zIndex: 2,
  },
  timelineDotCurrent: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotCurrentInner: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  timelineDotFuture: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  timelineItemTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  timelineItemTitleFuture: {
    color: colors.textSecondary,
  },
  timelineItemDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  timelineItemDescriptionFuture: {
    color: colors.textTertiary,
  },
  timelineDatePill: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timelineDateText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  resolutionCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resolutionTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  resolutionInner: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  resolutionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.chipInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolutionHeading: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  resolutionText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.5,
  },
  evidenceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...elevations.soft,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  evidenceBullet: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDeep,
    marginTop: 8,
  },
  evidenceText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.primaryDeep,
    lineHeight: typography.body * 1.4,
  },
  emptyEvidence: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  decorativeImageWrap: {
    height: 192,
    borderRadius: radius.lg,
    overflow: 'hidden',
    opacity: 0.4,
  },
  decorativeImage: {
    alignSelf: 'stretch',
    height: '100%',
  },
});

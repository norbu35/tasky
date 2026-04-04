import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CircleHelp } from 'lucide-react-native';
import { useBookingTimeline } from '../../../../features/bookings/hooks/useBookingTimeline';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { ScreenContainer } from '../../../../components/shells';

const { colors, spacing, typography, radius } = mobileTheme;

const figmaServiceImageUri =
  'https://www.figma.com/api/mcp/asset/0cf8176a-cff9-4d3a-9418-2a2d334f986f';

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

function getEventLabel(event: string): string {
  switch (event) {
    case 'booking_created':
      return 'Захиалга үүсгэсэн';
    case 'tasker_assigned':
      return 'Гүйцэтгэгч томилогдсон';
    case 'reschedule_requested':
      return 'Цаг өөрчлөх хүсэлт';
    case 'reschedule_accepted':
      return 'Цаг өөрчлөлт зөвшөөрсөн';
    case 'reschedule_declined':
      return 'Цаг өөрчлөлт татгалзсан';
    case 'reschedule_expired':
      return 'Хүсэлт дууссан';
    case 'tasker_marked_done':
      return 'Гүйцэтгэгч дуусгасан';
    case 'customer_confirmed':
      return 'Хэрэглэгч баталгаажуулсан';
    case 'cancelled':
      return 'Захиалга цуцалсан';
    case 'no_show':
      return 'Ирээгүй гэж тэмдэглэсэн';
    default:
      return event;
  }
}

function TimelineEventRow({
  index,
  event,
  isActive,
  isFuture,
}: {
  index: number;
  event: {
    event: string;
    timestamp: string;
    description?: string | null;
    is_future?: boolean;
  };
  isActive: boolean;
  isFuture: boolean;
}) {
  return (
    <View
      style={[styles.timelineRow, isFuture && styles.timelineRowFuture]}
      testID={`timeline-event-${index}-${isFuture ? 'future' : isActive ? 'active' : 'past'}`}
    >
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            isActive && styles.timelineDotActive,
            isFuture && styles.timelineDotFuture,
            !isActive && !isFuture && styles.timelineDotPast,
          ]}
        />
        {!isFuture ? (
          <View style={styles.timelineLine} />
        ) : (
          <View style={styles.timelineLineMuted} />
        )}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTimestamp, isActive && styles.timelineTimestampActive]}>
          {formatTimestamp(event.timestamp)}
        </Text>
        <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
          {getEventLabel(event.event)}
        </Text>
        {event.description ? (
          <Text style={styles.timelineDescription}>{event.description}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function BookingTimelineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: events, isLoading, isError, refetch } = useBookingTimeline(bookingId);
  const { data: booking } = useBookingDetail(bookingId);

  const timelineEvents = React.useMemo(
    () =>
      ((events ?? []) as {
        event: string;
        timestamp: string;
        description?: string | null;
        is_future?: boolean;
      }[]),
    [events],
  );
  const activeIndex = React.useMemo(() => {
    const lastNonFuture = timelineEvents.reduce<number>((acc, event, index) => {
      if (!event.is_future) return index;
      return acc;
    }, 0);
    return lastNonFuture;
  }, [timelineEvents]);

  return (
    <ScreenContainer testID="SCR-CUST-019">
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contextCard}>
            <View style={styles.contextImageWrap}>
              <Image source={{ uri: figmaServiceImageUri }} style={styles.contextImage} />
            </View>
            <View style={styles.contextCopy}>
              <Text style={styles.contextId}>
                {t(
                  'customer.bookings.timelineId',
                  `ID: #${(booking?.task_id ?? bookingId).slice(-6)}`,
                )}
              </Text>
              <Text style={styles.contextTitle} numberOfLines={2}>
                {booking?.task?.description ??
                  t('customer.bookings.timelineFallbackTitle', 'Даалгаврын дэлгэрэнгүй')}
              </Text>
              <Text style={styles.contextSubtitle} numberOfLines={1}>
                {booking?.tasker?.full_name
                  ? `${booking.tasker.full_name} (${t('customer.bookings.timelineTasker', 'Гүйцэтгэгч')})`
                  : t('customer.bookings.timelineTaskerFallback', 'Гүйцэтгэгч')}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingBlock}>
              <View style={styles.loadingLineLarge} />
              <View style={styles.loadingLineMedium} />
              <View style={styles.loadingLineMedium} />
            </View>
          ) : null}

          <View style={styles.timelineSection}>
            {timelineEvents.map((event, index) => (
              <TimelineEventRow
                key={`${event.event}-${event.timestamp}-${index}`}
                index={index}
                event={event}
                isActive={index === activeIndex}
                isFuture={Boolean(event.is_future)}
              />
            ))}
          </View>

          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpTitle}>
                {t('customer.bookings.helpTitle', 'Тусламж хэрэгтэй юу?')}
              </Text>
              <CircleHelp size={18} color={colors.secondary} />
            </View>
            <Text style={styles.helpBody}>
              {t(
                'customer.bookings.helpBody',
                'Хэрэв танд захиалгын талаар асуулт гарвал манай дэмжлэгийн багтай холбогдоорой.',
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(shared)/help')}
              style={styles.helpButton}
              testID="booking-timeline-help-cta"
            >
              <Text style={styles.helpButtonText}>
                {t('customer.bookings.helpCta', 'Оператортой холбогдох')}
              </Text>
            </Pressable>
          </View>

          {isError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void refetch()}
              style={styles.errorBanner}
              testID="booking-timeline-error"
            >
              <Text style={styles.errorBannerText}>
                {t(
                  'customer.bookings.timelineError',
                  'Захиалгын түүх ачааллахад алдаа гарлаа. Дахин оролдох.',
                )}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  contextImageWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  contextImage: {
    alignSelf: 'stretch',
    height: '100%',
  },
  contextCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  contextId: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  contextTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
    lineHeight: typography.title * 1.2,
  },
  contextSubtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  loadingBlock: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  loadingLineLarge: {
    height: 16,
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
    width: '55%',
  },
  loadingLineMedium: {
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
    width: '72%',
  },
  timelineSection: {
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  timelineRowFuture: {
    opacity: 0.45,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.background,
    backgroundColor: colors.primaryDeep,
    zIndex: 1,
  },
  timelineDotPast: {
    backgroundColor: colors.primaryDeep,
  },
  timelineDotActive: {
    backgroundColor: colors.secondary,
  },
  timelineDotFuture: {
    backgroundColor: colors.chipInactive,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: -1,
    backgroundColor: colors.border,
  },
  timelineLineMuted: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: -1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  timelineCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  timelineTimestamp: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timelineTimestampActive: {
    color: colors.secondary,
  },
  timelineLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  timelineLabelActive: {
    color: colors.secondary,
  },
  timelineDescription: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
  helpCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  helpBody: {
    fontSize: typography.body,
    color: colors.accent,
    lineHeight: typography.body * 1.5,
  },
  helpButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  helpButtonText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.secondaryForeground,
  },
  errorBanner: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.dangerForeground,
  },
});

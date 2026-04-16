import { useRouter, useLocalSearchParams } from 'expo-router';
import { CircleHelp, Clock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { ScreenContainer } from '../../../../components/shells';
import { Touchable } from '../../../../components/ui/Touchable';
import { mobileSurfaces, mobileTheme } from '../../../../design/tokenAdapter';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { useBookingTimeline } from '../../../../features/bookings/hooks/useBookingTimeline';

const { colors } = mobileTheme;
const { bookingTimeline } = mobileSurfaces;

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

function getEventLabel(event: string, t: (key: string) => string): string {
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

function TimelineEventRow({
  index,
  event,
  isActive,
  isFuture,
  t,
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
  t: (key: string) => string;
}) {
  // Dot colors are runtime-conditional → imperative
  const dotBg = isActive ? colors.secondary : isFuture ? colors.chipInactive : colors.primaryDeep;

  return (
    <View
      className={`flex-row gap-md items-start${isFuture ? ' opacity-[0.45]' : ''}`}
      testID={`timeline-event-${index}-${isFuture ? 'future' : isActive ? 'active' : 'past'}`}
    >
      {/* timelineRail */}
      <View className="w-6 items-center">
        <View
          className="rounded-full border-[3px] z-[1]"
          style={{
            width: bookingTimeline.dotSize,
            height: bookingTimeline.dotSize,
            borderColor: colors.background,
            backgroundColor: dotBg,
          }}
        />
        {!isFuture ? (
          <View
            className="flex-1 bg-border"
            style={{
              width: bookingTimeline.railWidth,
              minHeight: bookingTimeline.railMinHeight,
              marginTop: bookingTimeline.railOffset,
            }}
          />
        ) : (
          <View
            className="flex-1 bg-border opacity-50"
            style={{
              width: bookingTimeline.railWidth,
              minHeight: bookingTimeline.railMinHeight,
              marginTop: bookingTimeline.railOffset,
            }}
          />
        )}
      </View>
      <View className="flex-1 gap-xs">
        <Text
          className={`text-micro font-bold${isActive ? ' text-secondary' : ' text-text-secondary'}`}
        >
          {formatTimestamp(event.timestamp)}
        </Text>
        <Text
          className={`text-body font-bold${isActive ? ' text-secondary' : ' text-primary-deep'}`}
        >
          {getEventLabel(event.event, t)}
        </Text>
        {event.description ? (
          <Text className="text-caption text-text-secondary leading-relaxed">
            {event.description}
          </Text>
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
      (events ?? []) as {
        event: string;
        timestamp: string;
        description?: string | null;
        is_future?: boolean;
      }[],
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
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-md bg-muted rounded-lg p-lg">
            <View className="w-16 h-16 rounded-md overflow-hidden bg-card items-center justify-center">
              <Clock size={32} color={colors.secondary} />
            </View>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text
                className="text-micro font-bold text-secondary uppercase"
                style={{ letterSpacing: bookingTimeline.titleTracking }}
              >
                {t(
                  'customer.bookings.timelineId',
                  `ID: #${(booking?.task_id ?? bookingId).slice(-6)}`,
                )}
              </Text>
              <Text
                className="text-title font-bold text-primary-deep leading-tight"
                numberOfLines={2}
              >
                {booking?.task?.description ?? t('customer.bookings.timelineFallbackTitle')}
              </Text>
              <Text className="text-caption text-text-secondary" numberOfLines={1}>
                {booking?.tasker?.full_name
                  ? `${booking.tasker.full_name} (${t('customer.bookings.timelineTasker')})`
                  : t('customer.bookings.timelineTaskerFallback')}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View className="py-sm gap-sm">
              <View className="h-4 rounded-xs bg-muted" style={{ width: '55%' }} />
              <View className="h-3 rounded-xs bg-muted" style={{ width: '72%' }} />
              <View className="h-3 rounded-xs bg-muted" style={{ width: '72%' }} />
            </View>
          ) : null}

          <View className="gap-lg py-xs">
            {timelineEvents.map((event, index) => (
              <TimelineEventRow
                key={`${event.event}-${event.timestamp}-${index}`}
                index={index}
                event={event}
                isActive={index === activeIndex}
                isFuture={Boolean(event.is_future)}
                t={t}
              />
            ))}
          </View>

          <View className="bg-primary-deep rounded-lg p-lg gap-md">
            <View className="flex-row items-center justify-between">
              <Text className="text-title font-bold text-primary-foreground">
                {t('customer.bookings.helpTitle')}
              </Text>
              <CircleHelp size={18} color={colors.secondary} />
            </View>
            <Text className="text-body text-accent leading-relaxed">
              {t('customer.bookings.helpDescription')}
            </Text>
            <Touchable
              accessibilityRole="button"
              onPress={() => router.push('/(shared)/help')}
              className="rounded-md bg-secondary items-center justify-center px-lg"
              style={{ minHeight: bookingTimeline.helpCtaHeight }}
              testID="booking-timeline-help-cta"
            >
              <Text className="text-label font-bold text-secondary-foreground">
                {t('customer.bookings.helpCta')}
              </Text>
            </Touchable>
          </View>

          {isError ? (
            <Touchable
              accessibilityRole="button"
              onPress={() => void refetch()}
              className="bg-danger rounded-md p-md"
              testID="booking-timeline-error"
            >
              <Text className="text-label font-semibold text-danger-foreground">
                {t('BookingTimelineScreen.copy2')}
              </Text>
            </Touchable>
          ) : null}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

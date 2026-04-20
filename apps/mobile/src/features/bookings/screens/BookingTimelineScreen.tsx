import { useRouter } from 'expo-router';
import { CircleHelp, Clock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { screenLayout } from '@/design/screenLayout';

import { TimelineEventRow } from './BookingTimeline.parts';
import { useBookingTimelineScreen } from './useBookingTimelineScreen';

const { colors, spacing } = mobileTheme;
const { bookingTimeline } = mobileSurfaces;

export default function BookingTimelineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId, booking, timelineEvents, activeIndex, isLoading, isError, refetch } =
    useBookingTimelineScreen();

  return (
    <ScreenContainer testID="SCR-CUST-019">
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: screenLayout.insetX,
            paddingBottom: spacing['3xl'],
            gap: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-md bg-muted rounded-lg p-lg">
            <View className="w-16 h-16 rounded-md overflow-hidden bg-card items-center justify-center">
              <Clock size={24} color={colors.secondary} />
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
              <CircleHelp size={20} color={colors.secondary} />
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

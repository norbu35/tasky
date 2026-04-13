import React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  CalendarPlus2,
  Check,
  ChevronLeft,
  MessageSquare,
  UserRound,
} from 'lucide-react-native';
import { InsetScrollView, ScreenContainer } from '../../../components/shells';
import { Button } from '../../../components/ui/Button';
import { Touchable } from '../../../components/ui/Touchable';
import { mobileTheme } from '../../../design/tokenAdapter';
import { elevations } from '../../../design/elevations';
import { cn } from '../../../lib/cn';

const { colors, spacing } = mobileTheme;

export default function BookingConfirmedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId, taskerName } = useLocalSearchParams<{ bookingId: string; taskerName?: string }>();
  const [canAddToCalendar, setCanAddToCalendar] = React.useState(false);
  const canAddToCalendarRef = React.useRef(canAddToCalendar);

  React.useEffect(() => {
    canAddToCalendarRef.current = canAddToCalendar;
  }, [canAddToCalendar]);

  React.useEffect(() => {
    let cancelled = false;
    const candidate = Platform.OS === 'ios' ? 'calshow:0' : 'content://com.android.calendar/time';

    void Linking.canOpenURL(candidate)
      .then((canOpen) => {
        if (!cancelled && canOpen !== canAddToCalendarRef.current) {
          canAddToCalendarRef.current = canOpen;
          setCanAddToCalendar(canOpen);
        }
      })
      .catch(() => {
        if (!cancelled && canAddToCalendarRef.current) {
          canAddToCalendarRef.current = false;
          setCanAddToCalendar(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewBooking = React.useCallback(() => {
    if (!bookingId) {
      router.replace('/(customer)/bookings');
      return;
    }
    router.replace(`/(customer)/bookings/${bookingId}`);
  }, [bookingId, router]);

  const handleDone = React.useCallback(() => {
    router.replace('/(customer)/bookings');
  }, [router]);

  const handleMessage = React.useCallback(() => {
    router.push(bookingId ? `/inbox/${bookingId}` : '/inbox');
  }, [bookingId, router]);

  const handleCalendar = React.useCallback(() => {
    const url = Platform.OS === 'ios' ? 'calshow:0' : 'content://com.android.calendar/time';
    void Linking.openURL(url).catch(() => {
      // Ignore platform-specific failures; the CTA is conditional.
    });
  }, []);

  return (
    <ScreenContainer testID="SCR-CUST-015">
      <View className="flex-row items-center justify-between px-lg pt-sm pb-md">
        <Touchable
          accessibilityRole="button"
          onPress={handleDone}
          className="w-[40px] h-[40px] rounded-md items-center justify-center bg-card"
          testID="booking-confirmed-screen-close"
        >
          <ChevronLeft size={22} color={colors.primaryDeep} />
        </Touchable>
        <View className="flex-1" />
      </View>

      <InsetScrollView
        contentContainerStyle={{
          alignItems: 'center',
          gap: spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing['3xl'],
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        extraBottomInset={spacing.xl}
      >
        <View className="pt-2xl">
          <View className="w-[96px] h-[96px] rounded-full bg-muted items-center justify-center">
            <Check size={36} color={colors.verified} strokeWidth={3} />
          </View>
        </View>

        <Text className="text-heading font-sans-bold text-primary-deep text-center tracking-tight px-md leading-tight">
          {t('customer.bookings.confirmedHeadline')}
        </Text>

        <Text className="text-body text-text-secondary text-center px-md leading-relaxed">
          {t('BookingConfirmedScreen.copy1')}
        </Text>

        <View className="self-stretch mt-md">
          <View className="rounded-full px-md py-xs bg-muted self-center">
            <Text className="text-label font-sans-bold text-secondary uppercase tracking-wide">
              {t('customer.bookings.nextStepsHeading')}
            </Text>
          </View>
        </View>

        <View
          className="self-stretch flex-row rounded-md bg-muted p-lg gap-md"
          style={{ ...elevations.soft }}
        >
          <View className="w-[40px] h-[40px] rounded-md items-center justify-center bg-card">
            <CalendarPlus2 size={20} color={colors.primaryDeep} />
          </View>
          <View className="flex-1 gap-xs">
            <Text className="text-body font-sans-bold text-primary-deep leading-snug">
              {t('customer.bookings.nextStepsTitle')}
            </Text>
            <Text className="text-label text-text-secondary leading-relaxed">
              {t('BookingConfirmedScreen.copy2')}
            </Text>
          </View>
        </View>

        <View
          className="self-stretch flex-row items-center justify-between rounded-md bg-card p-lg gap-md"
          style={{ ...elevations.soft }}
        >
          <View className="flex-row items-center flex-1 gap-md">
            <View className="w-[48px] h-[48px] rounded-md overflow-hidden bg-muted items-center justify-center">
              <UserRound size={28} color={colors.textSecondary} />
            </View>
            <View className="flex-1 gap-[2px]">
              <Text className="text-micro text-text-secondary">
                {t('customer.bookings.providerLabel')}
              </Text>
              <Text className="text-body font-sans-bold text-primary-deep">
                {taskerName ?? t('customer.bookings.providerLabel')}
              </Text>
            </View>
          </View>
        </View>

        <View className="self-stretch mt-md gap-md">
          <Touchable
            accessibilityRole="button"
            onPress={handleMessage}
            className="self-stretch rounded-md overflow-hidden"
            testID="booking-confirmed-screen-cta"
          >
            <LinearGradient
              colors={[colors.primaryDeep, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                minHeight: 52,
                paddingHorizontal: spacing.xl,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: spacing.sm,
              }}
            >
              <MessageSquare size={18} color={colors.primaryForeground} />
              <Text className="text-body font-sans-bold text-primary-foreground">
                {t('TaskDetailCustomerScreen.messageTasker')}
              </Text>
            </LinearGradient>
          </Touchable>

          <Touchable
            accessibilityRole="button"
            onPress={handleViewBooking}
            className="items-center py-sm"
            testID="booking-confirmed-screen-secondary-cta"
          >
            <Text className="text-body font-sans-bold text-primary-deep">
              {t('customer.bookings.ctaViewBooking')}
            </Text>
          </Touchable>
        </View>
      </InsetScrollView>

      <View
        pointerEvents="none"
        className="absolute left-0 right-0 bottom-0 h-[80px] bg-background rounded-tl-[40px] rounded-tr-[40px] opacity-70"
      />
    </ScreenContainer>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { CalendarPlus2, Check, ChevronLeft, MessageSquare, UserRound } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import { useBookingConfirmed } from './useBookingConfirmed';

const { colors, spacing } = mobileTheme;
const { bookingConfirmed } = mobileSurfaces;

export default function BookingConfirmedScreen() {
  const { t } = useTranslation();
  const { taskerName, handleViewBooking, handleDone, handleMessage } = useBookingConfirmed();

  return (
    <ScreenContainer testID="SCR-CUST-015">
      <View className="flex-row items-center justify-between px-lg pt-sm pb-md">
        <Touchable
          accessibilityRole="button"
          onPress={handleDone}
          className="rounded-md items-center justify-center bg-card"
          style={{ width: bookingConfirmed.navIconBox, height: bookingConfirmed.navIconBox }}
          testID="booking-confirmed-screen-close"
        >
          <ChevronLeft size={20} color={colors.primaryDeep} />
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
          <View
            className="rounded-full bg-muted items-center justify-center"
            style={{ width: bookingConfirmed.heroSize, height: bookingConfirmed.heroSize }}
          >
            <Check size={24} color={colors.verified} strokeWidth={3} />
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
          <View
            className="rounded-md items-center justify-center bg-card"
            style={{
              width: bookingConfirmed.nextStepIconBox,
              height: bookingConfirmed.nextStepIconBox,
            }}
          >
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
            <View
              className="rounded-md overflow-hidden bg-muted items-center justify-center"
              style={{
                width: bookingConfirmed.providerAvatarBox,
                height: bookingConfirmed.providerAvatarBox,
              }}
            >
              <UserRound size={24} color={colors.textSecondary} />
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
                minHeight: bookingConfirmed.primaryCtaHeight,
                paddingHorizontal: spacing.xl,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: spacing.sm,
              }}
            >
              <MessageSquare size={20} color={colors.primaryForeground} />
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
        className="absolute left-0 right-0 bottom-0 bg-background opacity-70"
        style={{
          height: bookingConfirmed.bottomGlowHeight,
          borderTopLeftRadius: bookingConfirmed.bottomGlowRadius,
          borderTopRightRadius: bookingConfirmed.bottomGlowRadius,
        }}
      />
    </ScreenContainer>
  );
}

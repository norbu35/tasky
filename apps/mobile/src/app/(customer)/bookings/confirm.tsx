import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { PriceTag } from '../../../components/ui/PriceTag';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { Touchable } from '../../../components/ui/Touchable';
import { useAcceptApplication } from '../../../features/bookings/hooks/useAcceptApplication';
import { useConfirmBookingIntent } from '../../../features/bookings/hooks/useConfirmBookingIntent';

export default function BookingConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId: string;
    applicationId: string;
    taskerId: string;
    taskTitle: string;
    taskBudget: string;
    taskSchedule: string;
    taskerName: string;
    taskerAvatar: string;
    taskerRating: string;
    source?: 'application' | 'rebook' | 'instant_match';
    bookingIntentId?: string;
  }>();

  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const { mutateAsync: acceptApplication, isPending } = useAcceptApplication();
  const { mutateAsync: confirmBookingIntent, isPending: isConfirmingIntent } =
    useConfirmBookingIntent();

  const handleConfirm = useCallback(async () => {
    const source = params.source ?? 'application';
    const usesBookingIntent = source === 'rebook' || source === 'instant_match';
    const idempotencyKey = usesBookingIntent
      ? `confirm-intent-${params.bookingIntentId}-${Date.now()}`
      : `confirm-${params.taskId}-${params.applicationId}-${Date.now()}`;
    const booking = usesBookingIntent
      ? await confirmBookingIntent({
          bookingIntentId: params.bookingIntentId!,
          liabilityDisclaimerAccepted: true,
          idempotencyKey,
        })
      : await acceptApplication({
          taskId: params.taskId,
          applicationId: params.applicationId,
          liabilityDisclaimerAccepted: true,
          idempotencyKey,
        });
    router.replace({
      pathname: '/(customer)/bookings/confirmed',
      params: { bookingId: booking.id, taskerName: params.taskerName },
    });
  }, [params, acceptApplication, confirmBookingIntent, router]);

  return (
    <DetailTemplate
      testID="SCR-CUST-014"
      ctaLabel={t('customer.bookings.ctaConfirm')}
      ctaOnPress={handleConfirm}
      ctaLoading={isPending || isConfirmingIntent}
      ctaDisabled={!disclaimerChecked}
    >
      {/* Tasker Info */}
      <View className="mb-xl">
        <Text className="text-heading font-sans-bold text-primary-deep mb-md">
          {t('customer.bookings.sectionTasker')}
        </Text>
        <View className="flex-row items-center gap-md bg-muted rounded-md p-md">
          <ProfileAvatar
            uri={params.taskerAvatar}
            name={params.taskerName}
            size="lg"
            showVerified
          />
          <View className="flex-1">
            <Text className="text-body font-semibold text-primary-deep">{params.taskerName}</Text>
            {params.taskerRating && (
              <Text className="text-caption text-text-secondary mt-xs">{params.taskerRating}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Task Summary */}
      <View className="mb-xl">
        <Text className="text-heading font-sans-bold text-primary-deep mb-md">
          {t('customer.bookings.sectionTask')}
        </Text>
        <Text className="text-body text-primary-deep mb-sm">{params.taskTitle}</Text>
        {params.taskSchedule && (
          <Text className="text-caption text-text-secondary mb-sm">
            {new Date(params.taskSchedule).toLocaleDateString()}
          </Text>
        )}
        {params.taskBudget && <PriceTag amount={Number(params.taskBudget)} size="sm" />}
      </View>

      {/* Payment Note */}
      <View className="mb-xl">
        <Text className="text-caption text-accent italic">
          {t('customer.bookings.paymentNote')}
        </Text>
      </View>

      {/* Disclaimer */}
      <View className="mb-xl">
        <Text className="text-heading font-sans-bold text-primary-deep mb-md">
          {t('customer.bookings.sectionDisclaimer')}
        </Text>
        <Text className="text-caption text-text-secondary leading-[20px] mb-md">
          {t('BookingConfirmScreen.copy1')}
        </Text>
        <Touchable
          className="flex-row items-center gap-sm"
          onPress={() => setDisclaimerChecked(!disclaimerChecked)}
          testID="booking-confirm-screen-disclaimer"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: disclaimerChecked }}
        >
          <View
            className={
              disclaimerChecked
                ? 'w-6 h-6 rounded-xs border-2 border-primary bg-primary items-center justify-center'
                : 'w-6 h-6 rounded-xs border-2 border-border items-center justify-center'
            }
          >
            {disclaimerChecked && (
              <Text className="text-primary-foreground text-[14px] font-bold">{'✓'}</Text>
            )}
          </View>
          <Text className="text-body text-primary-deep flex-1">
            {t('customer.bookings.disclaimerAcknowledge')}
          </Text>
        </Touchable>
      </View>

      {/* Calendar Prompt */}
      <View className="mb-xl">
        <Text className="text-subtitle font-semibold text-primary mb-sm">
          {t('customer.bookings.calendarPromptTitle')}
        </Text>
        <Text className="text-caption text-text-secondary">{t('BookingConfirmScreen.copy2')}</Text>
      </View>
    </DetailTemplate>
  );
}

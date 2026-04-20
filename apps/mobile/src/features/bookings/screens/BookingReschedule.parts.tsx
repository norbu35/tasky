import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CalendarDays, Clock3, Info, CalendarRange } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '@/components/shells';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import {
  RESCHEDULE_SURFACE,
  type RescheduleState,
  isTimeSelected,
  AVAILABLE_TIMES,
} from './BookingReschedule.model';
import { DatePicker } from './BookingReschedule.datePicker';

const { colors, spacing, typography } = mobileTheme;

interface CurrentScheduleCardProps {
  scheduledAtLabel: string;
}

export function CurrentScheduleCard({ scheduledAtLabel }: CurrentScheduleCardProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between bg-muted rounded-lg p-lg">
      <View className="flex-1 gap-xs">
        <Text className="text-body text-text-secondary">
          {t('customer.bookings.sectionCurrentSchedule')}
        </Text>
        <View className="flex-row items-center gap-sm">
          <CalendarDays size={16} color={colors.primaryDeep} />
          <Text className="text-body font-sans-bold text-primary-deep">{scheduledAtLabel}</Text>
        </View>
      </View>
      <View
        className="rounded-md bg-card items-center justify-center"
        style={{
          width: RESCHEDULE_SURFACE.currentScheduleIconBox,
          height: RESCHEDULE_SURFACE.currentScheduleIconBox,
        }}
      >
        <Clock3 size={16} color={colors.secondary} />
      </View>
    </View>
  );
}

export function StepIndicator() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between px-sm">
      <View className="items-center gap-xs">
        <View
          className="rounded-md bg-primary-deep items-center justify-center"
          style={{
            width: RESCHEDULE_SURFACE.stepBadge,
            height: RESCHEDULE_SURFACE.stepBadge,
          }}
        >
          <Text className="text-micro font-sans-bold text-primary-foreground">1</Text>
        </View>
        <Text className="text-caption font-sans-bold text-text-secondary uppercase tracking-[0.075em]">
          {t('customer.bookings.stepChooseDay')}
        </Text>
      </View>
      <View className="flex-1 h-[2px] mx-sm bg-border" />
      <View className="items-center gap-xs opacity-[0.45]">
        <View
          className="rounded-md bg-muted items-center justify-center"
          style={{
            width: RESCHEDULE_SURFACE.stepBadge,
            height: RESCHEDULE_SURFACE.stepBadge,
          }}
        >
          <Text className="text-micro font-sans-bold text-primary-deep">2</Text>
        </View>
        <Text className="text-caption font-sans-bold text-text-secondary uppercase tracking-[0.075em]">
          {t('customer.bookings.stepConfirm')}
        </Text>
      </View>
    </View>
  );
}

export { DatePicker };

interface TimeSlotListProps {
  selectedDateTime: Date;
  onSelectTime: (time: string) => void;
}

export function TimeSlotList({ selectedDateTime, onSelectTime }: TimeSlotListProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-md">
      <View className="flex-row items-center gap-xs">
        <Clock3 size={16} color={colors.primaryDeep} />
        <Text
          className="text-heading font-sans-bold text-primary-deep"
          style={{ fontWeight: '800' }}
        >
          {t('customer.bookings.sectionAvailableTimes')}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-sm">
        {AVAILABLE_TIMES.map((time) => {
          const selected = isTimeSelected(selectedDateTime, time);
          return (
            <Touchable
              key={time}
              onPress={() => onSelectTime(time)}
              className={cn(
                'rounded-md bg-muted items-center justify-center px-lg',
                selected && 'bg-primary-deep',
              )}
              style={[
                {
                  minWidth: RESCHEDULE_SURFACE.timeChipMinWidth,
                  minHeight: RESCHEDULE_SURFACE.timeChipMinHeight,
                },
                selected ? elevations.soft : undefined,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`reschedule-time-${time}`}
            >
              <Text
                className={cn(
                  'text-label font-sans-bold text-primary-deep',
                  selected && 'text-primary-foreground',
                )}
              >
                {time}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

interface ReasonInputProps {
  reason: string;
  onReasonChange: (text: string) => void;
}

export function ReasonInput({ reason, onReasonChange }: ReasonInputProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-md">
      <Text className="text-body font-sans-bold text-primary-deep">
        {t('customer.bookings.labelReason')}
      </Text>
      <View
        className="bg-muted rounded-md p-md"
        style={{ minHeight: RESCHEDULE_SURFACE.reasonMinHeight }}
      >
        <Input
          style={{
            minHeight: RESCHEDULE_SURFACE.reasonInputMinHeight,
            color: colors.primaryDeep,
            fontSize: typography.body,
            textAlignVertical: 'top',
          }}
          placeholder={t('customer.bookings.placeholderReason')}
          placeholderTextColor={colors.chipInactive}
          value={reason}
          onChangeText={onReasonChange}
          maxLength={200}
          multiline
          numberOfLines={4}
          testID="reschedule-screen-reason"
        />
      </View>
      <Text className="text-caption text-text-secondary">
        {t('customer.bookings.helperReason')}
      </Text>
    </View>
  );
}

export function PolicyNote() {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-sm items-start bg-muted rounded-md p-md">
      <Info size={16} color={colors.primaryDeep} />
      <Text
        className="flex-1 text-caption text-primary-deep"
        style={{ lineHeight: typography.caption * 1.5 }}
      >
        {t('customer.bookings.scheduleAuthorityNote')}
      </Text>
    </View>
  );
}

interface RequestStateCardProps {
  requestState: RescheduleState;
}

export function RequestStateCard({ requestState }: RequestStateCardProps) {
  const { t } = useTranslation();
  if (requestState === 'request_form') return null;

  return (
    <View className="bg-muted rounded-lg p-lg gap-sm items-start">
      <View
        className="rounded-md bg-card items-center justify-center"
        style={{
          width: RESCHEDULE_SURFACE.stateIconBox,
          height: RESCHEDULE_SURFACE.stateIconBox,
        }}
      >
        <CalendarRange size={20} color={colors.secondary} />
      </View>
      <Text className="text-body font-sans-bold text-primary-deep">
        {requestState === 'awaiting_response'
          ? t('customer.bookings.statusAwaiting')
          : requestState === 'accepted'
            ? t('customer.bookings.statusAccepted')
            : requestState === 'declined'
              ? t('customer.bookings.statusDeclined')
              : t('customer.bookings.statusExpired')}
      </Text>
      <Text
        className="text-label text-text-secondary"
        style={{ lineHeight: typography.label * 1.5 }}
      >
        {requestState === 'awaiting_response'
          ? t('customer.bookings.awaitingMessage')
          : requestState === 'accepted'
            ? t('customer.bookings.acceptedMessage')
            : requestState === 'declined'
              ? t('customer.bookings.declinedMessage')
              : t('customer.bookings.expiredMessage')}
      </Text>
    </View>
  );
}

interface SubmitButtonProps {
  isPending: boolean;
  onSubmit: () => void;
}

export function SubmitButton({ isPending, onSubmit }: SubmitButtonProps) {
  const { t } = useTranslation();
  return (
    <StickyActionBar>
      <View className="pt-md pb-lg px-lg">
        <Touchable
          accessibilityRole="button"
          onPress={() => void onSubmit()}
          className="rounded-md overflow-hidden"
          testID="reschedule-screen-next"
          disabled={isPending}
        >
          <LinearGradient
            colors={[colors.primaryDeep, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                minHeight: RESCHEDULE_SURFACE.ctaHeight,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              },
              isPending && { opacity: 0.7 },
            ]}
          >
            <Text className="text-body font-sans-bold text-primary-foreground">
              {t('customer.bookings.ctaSubmitReschedule')}
            </Text>
            <ArrowRight size={20} color={colors.primaryForeground} />
          </LinearGradient>
        </Touchable>
      </View>
    </StickyActionBar>
  );
}

export { ScreenContainer, InsetScrollView };

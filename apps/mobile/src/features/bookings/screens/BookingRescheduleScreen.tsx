import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Clock3,
  Info,
  CalendarRange,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '@/components/shells';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';
import { useBookingDetail } from '../hooks/useBookingDetail';
import { useReschedule } from '../hooks/useReschedule';

const { colors, spacing, typography } = mobileTheme;
const RESCHEDULE_SURFACE = {
  navIconBox: 32,
  currentScheduleIconBox: 34,
  stepBadge: 32,
  calendarCellWidth: '14.2857%',
  calendarNavIcon: 18,
  timeChipMinWidth: 72,
  timeChipMinHeight: 40,
  reasonMinHeight: 120,
  reasonInputMinHeight: 96,
  stateIconBox: 40,
  ctaHeight: 56,
} as const;

type RescheduleState = 'request_form' | 'awaiting_response' | 'accepted' | 'declined' | 'expired';

function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

function formatMonthTitle(date: Date): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year} оны ${month}-р сар`;
}

function buildCalendarCells(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, index) => {
    if (index < offset || index >= offset + daysInMonth) return null;
    return new Date(year, month, index - offset + 1);
  });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekdayLabels(t: (key: string) => string) {
  return [
    t('customer.bookings.weekdays.mon'),
    t('customer.bookings.weekdays.tue'),
    t('customer.bookings.weekdays.wed'),
    t('customer.bookings.weekdays.thu'),
    t('customer.bookings.weekdays.fri'),
    t('customer.bookings.weekdays.sat'),
    t('customer.bookings.weekdays.sun'),
  ];
}

export default function BookingRescheduleScreen() {
  const { t } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: reschedule, isPending } = useReschedule();
  const { data: booking } = useBookingDetail(bookingId);

  const tomorrow = React.useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    return next;
  }, []);

  const [selectedDateTime, setSelectedDateTime] = React.useState<Date>(tomorrow);
  const [reason, setReason] = React.useState('');
  const [requestState, setRequestState] = React.useState<RescheduleState>('request_form');

  const visibleMonth = selectedDateTime;
  const calendarCells = React.useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const weekdayLabels = React.useMemo(() => getWeekdayLabels(t), [t]);
  const scheduledAtLabel = booking?.task?.scheduled_at
    ? formatDateTime(booking.task.scheduled_at)
    : t('customer.bookings.scheduleUnavailable');

  const updateSelectedTime = React.useCallback((time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    setSelectedDateTime((current) => {
      const next = new Date(current);
      next.setHours(hours, minutes, 0, 0);
      return next;
    });
  }, []);

  const updateSelectedDay = React.useCallback((date: Date) => {
    setSelectedDateTime((current) => {
      const next = new Date(date);
      next.setHours(current.getHours(), current.getMinutes(), 0, 0);
      return next;
    });
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const idempotencyKey = `reschedule-${bookingId}-${Date.now()}`;
    await reschedule({
      bookingId,
      proposed_scheduled_at: selectedDateTime.toISOString(),
      reason: reason || undefined,
      idempotencyKey,
    });
    setRequestState('awaiting_response');
  }, [bookingId, reason, reschedule, selectedDateTime]);

  return (
    <ScreenContainer testID="SCR-CUST-020">
      <InsetScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing['2xl'],
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        extraBottomInset={120}
      >
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
            <Text className="text-caption font-sans-bold text-text-secondary uppercase tracking-wide">
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
            <Text className="text-caption font-sans-bold text-text-secondary uppercase tracking-wide">
              {t('customer.bookings.stepConfirm')}
            </Text>
          </View>
        </View>

        <View className="bg-muted rounded-lg p-lg gap-lg" style={elevations.soft}>
          <View className="flex-row items-center justify-between">
            <Text className="text-subtitle font-sans-bold text-primary-deep">
              {formatMonthTitle(visibleMonth)}
            </Text>
            <View className="flex-row gap-xs">
              <Touchable
                className="rounded-sm bg-muted items-center justify-center"
                style={{
                  width: RESCHEDULE_SURFACE.navIconBox,
                  height: RESCHEDULE_SURFACE.navIconBox,
                }}
                accessibilityRole="button"
                testID="reschedule-month-prev"
              >
                <ChevronLeftIcon
                  size={RESCHEDULE_SURFACE.calendarNavIcon}
                  color={colors.primaryDeep}
                />
              </Touchable>
              <Touchable
                className="rounded-sm bg-muted items-center justify-center"
                style={{
                  width: RESCHEDULE_SURFACE.navIconBox,
                  height: RESCHEDULE_SURFACE.navIconBox,
                }}
                accessibilityRole="button"
                testID="reschedule-month-next"
              >
                <ChevronRight
                  size={RESCHEDULE_SURFACE.calendarNavIcon}
                  color={colors.primaryDeep}
                />
              </Touchable>
            </View>
          </View>

          <View className="flex-row">
            {weekdayLabels.map((day) => (
              <Text
                key={day}
                className="flex-1 text-center text-micro font-sans-bold text-text-secondary tracking-wide"
              >
                {day}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarCells.map((cell, index) => {
              if (!cell) {
                return (
                  <View
                    key={`empty-${index}`}
                    className="aspect-square items-center justify-center rounded-sm"
                    style={{ width: RESCHEDULE_SURFACE.calendarCellWidth }}
                  />
                );
              }
              const isSelected = sameDay(cell, selectedDateTime);
              const isTomorrow = sameDay(cell, tomorrow);
              const isPast = cell < tomorrow;
              const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
              return (
                <Touchable
                  key={cell.toISOString()}
                  onPress={() => updateSelectedDay(cell)}
                  className={cn(
                    'aspect-square items-center justify-center rounded-sm',
                    isSelected && 'bg-primary-deep',
                    isPast && 'opacity-25',
                  )}
                  style={[
                    { width: RESCHEDULE_SURFACE.calendarCellWidth },
                    isSelected ? elevations.soft : undefined,
                  ]}
                  testID={
                    isSelected
                      ? 'reschedule-screen-date-picker'
                      : `reschedule-date-${cell.toISOString()}`
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isPast }}
                >
                  <Text
                    className={cn(
                      'text-label text-primary-deep font-medium',
                      isSelected && 'text-primary-foreground font-sans-bold',
                      isPast && 'text-text-secondary',
                      isWeekend && !isSelected && 'text-danger',
                      isTomorrow && !isSelected && 'text-danger',
                    )}
                  >
                    {cell.getDate()}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </View>

        <View className="gap-md">
          <View className="flex-row items-center gap-xs">
            <Clock3 size={14} color={colors.primaryDeep} />
            <Text
              className="text-heading font-sans-bold text-primary-deep"
              style={{ fontWeight: '800' }}
            >
              {t('customer.bookings.sectionAvailableTimes')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-sm">
            {['09:00', '10:00', '11:00', '14:00', '15:00'].map((time) => {
              const isSelected =
                formatDateTime(selectedDateTime).endsWith(` ${time}`) ||
                (time === '10:00' && formatDateTime(selectedDateTime).endsWith(' 10:00'));
              return (
                <Touchable
                  key={time}
                  onPress={() => updateSelectedTime(time)}
                  className={cn(
                    'rounded-md bg-muted items-center justify-center px-lg',
                    isSelected && 'bg-primary-deep',
                  )}
                  style={[
                    {
                      minWidth: RESCHEDULE_SURFACE.timeChipMinWidth,
                      minHeight: RESCHEDULE_SURFACE.timeChipMinHeight,
                    },
                    isSelected ? elevations.soft : undefined,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  testID={`reschedule-time-${time}`}
                >
                  <Text
                    className={cn(
                      'text-label font-sans-bold text-primary-deep',
                      isSelected && 'text-primary-foreground',
                    )}
                  >
                    {time}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </View>

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
              onChangeText={setReason}
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

        <View className="flex-row gap-sm items-start bg-muted rounded-md p-md">
          <Info size={16} color={colors.primaryDeep} />
          <Text
            className="flex-1 text-caption text-primary-deep"
            style={{ lineHeight: typography.caption * 1.5 }}
          >
            {t('customer.bookings.scheduleAuthorityNote')}
          </Text>
        </View>

        {requestState !== 'request_form' ? (
          <View className="bg-muted rounded-lg p-lg gap-sm items-start">
            <View
              className="rounded-md bg-card items-center justify-center"
              style={{
                width: RESCHEDULE_SURFACE.stateIconBox,
                height: RESCHEDULE_SURFACE.stateIconBox,
              }}
            >
              <CalendarRange size={18} color={colors.secondary} />
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
        ) : null}
      </InsetScrollView>

      <StickyActionBar>
        <View className="pt-md pb-lg px-lg">
          <Touchable
            accessibilityRole="button"
            onPress={() => void handleSubmit()}
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
              <ArrowRight size={18} color={colors.primaryForeground} />
            </LinearGradient>
          </Touchable>
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}

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
import { Pressable, Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../../../components/shells';
import { Input } from '../../../../components/ui/Input';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { useReschedule } from '../../../../features/bookings/hooks/useReschedule';
import { cn } from '../../../../lib/cn';

const { colors, spacing, typography } = mobileTheme;

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
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, index) => {
    if (index < offset || index >= offset + daysInMonth) return null;
    return new Date(year, month, index - offset + 1);
  });
  return cells;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function RescheduleScreen() {
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
        {/* Current schedule card */}
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
          <View className="w-[34px] h-[34px] rounded-md bg-card items-center justify-center">
            <Clock3 size={16} color={colors.secondary} />
          </View>
        </View>

        {/* Step indicator */}
        <View className="flex-row items-center justify-between px-sm">
          <View className="items-center gap-xs">
            <View className="w-[32px] h-[32px] rounded-md bg-primary-deep items-center justify-center">
              <Text className="text-micro font-sans-bold text-primary-foreground">1</Text>
            </View>
            <Text className="text-caption font-sans-bold text-text-secondary uppercase tracking-wide">
              {t('customer.bookings.stepChooseDay')}
            </Text>
          </View>
          <View className="flex-1 h-[2px] mx-sm bg-border" />
          <View className="items-center gap-xs opacity-[0.45]">
            <View className="w-[32px] h-[32px] rounded-md bg-muted items-center justify-center">
              <Text className="text-micro font-sans-bold text-primary-deep">2</Text>
            </View>
            <Text className="text-caption font-sans-bold text-text-secondary uppercase tracking-wide">
              {t('customer.bookings.stepConfirm')}
            </Text>
          </View>
        </View>

        {/* Calendar card */}
        <View className="bg-muted rounded-lg p-lg gap-lg" style={elevations.soft}>
          <View className="flex-row items-center justify-between">
            <Text className="text-subtitle font-sans-bold text-primary-deep">
              {formatMonthTitle(visibleMonth)}
            </Text>
            <View className="flex-row gap-xs">
              <Pressable
                className="w-[32px] h-[32px] rounded-sm bg-muted items-center justify-center"
                accessibilityRole="button"
              >
                <ChevronLeftIcon size={18} color={colors.primaryDeep} />
              </Pressable>
              <Pressable
                className="w-[32px] h-[32px] rounded-sm bg-muted items-center justify-center"
                accessibilityRole="button"
              >
                <ChevronRight size={18} color={colors.primaryDeep} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row">
            {[
              t('RescheduleScreen.copy1'),
              t('RescheduleScreen.copy2'),
              t('RescheduleScreen.copy3'),
              t('RescheduleScreen.copy4'),
              t('RescheduleScreen.copy5'),
              t('RescheduleScreen.copy6'),
              t('RescheduleScreen.copy7'),
            ].map((day) => (
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
                    className="w-[14.2857%] aspect-square items-center justify-center rounded-sm"
                  />
                );
              }
              const isSelected = sameDay(cell, selectedDateTime);
              const isTomorrow = sameDay(cell, tomorrow);
              const isPast = cell < tomorrow;
              const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
              return (
                <Pressable
                  key={cell.toISOString()}
                  onPress={() => updateSelectedDay(cell)}
                  className={cn(
                    'w-[14.2857%] aspect-square items-center justify-center rounded-sm',
                    isSelected && 'bg-primary-deep',
                    isPast && 'opacity-25',
                  )}
                  style={isSelected ? elevations.soft : undefined}
                  testID={isSelected ? 'reschedule-screen-date-picker' : undefined}
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
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Time section */}
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
                <Pressable
                  key={time}
                  onPress={() => updateSelectedTime(time)}
                  className={cn(
                    'min-w-[72px] min-h-[40px] rounded-md bg-muted items-center justify-center px-lg',
                    isSelected && 'bg-primary-deep',
                  )}
                  style={isSelected ? elevations.soft : undefined}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    className={cn(
                      'text-label font-sans-bold text-primary-deep',
                      isSelected && 'text-primary-foreground',
                    )}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reason section */}
        <View className="gap-md">
          <Text className="text-body font-sans-bold text-primary-deep">
            {t('customer.bookings.labelReason')}
          </Text>
          <View className="min-h-[120px] bg-muted rounded-md p-md">
            <Input
              style={{
                minHeight: 96,
                color: colors.primaryDeep,
                fontSize: typography.body,
                textAlignVertical: 'top',
              }}
              placeholder={t('RescheduleScreen.placeholderReason')}
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

        {/* Info tip */}
        <View className="flex-row gap-sm items-start bg-muted rounded-md p-md">
          <Info size={16} color={colors.primaryDeep} />
          <Text
            className="flex-1 text-caption text-primary-deep"
            style={{ lineHeight: typography.caption * 1.5 }}
          >
            {t('RescheduleScreen.scheduleAuthorityNote')}
          </Text>
        </View>

        {/* State card */}
        {requestState !== 'request_form' ? (
          <View className="bg-muted rounded-lg p-lg gap-sm items-start">
            <View className="w-[40px] h-[40px] rounded-md bg-card items-center justify-center">
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
                ? t('RescheduleScreen.awaitingMessage')
                : requestState === 'accepted'
                  ? t('RescheduleScreen.acceptedMessage')
                  : requestState === 'declined'
                    ? t('RescheduleScreen.declinedMessage')
                    : t('RescheduleScreen.expiredMessage')}
            </Text>
          </View>
        ) : null}
      </InsetScrollView>

      <StickyActionBar>
        <View className="pt-md pb-lg px-lg">
          <Pressable
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
                  minHeight: 56,
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
          </Pressable>
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}

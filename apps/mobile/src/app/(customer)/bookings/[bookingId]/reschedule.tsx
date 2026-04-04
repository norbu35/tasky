import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Clock3,
  Info,
  CalendarRange,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../../../components/shells';
import { Input } from '../../../../components/ui/Input';
import { useReschedule } from '../../../../features/bookings/hooks/useReschedule';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { elevations } from '../../../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

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
    : t('customer.bookings.scheduleUnavailable', 'Хуваарь тодорхойгүй');

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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraBottomInset={120}
      >
          <View style={styles.currentScheduleCard}>
            <View style={styles.currentScheduleCopy}>
              <Text style={styles.currentScheduleLabel}>
                {t('customer.bookings.sectionCurrentSchedule', 'Одоогийн хуваарь')}
              </Text>
              <View style={styles.currentScheduleValueRow}>
                <CalendarDays size={16} color={colors.primaryDeep} />
                <Text style={styles.currentScheduleValue}>{scheduledAtLabel}</Text>
              </View>
            </View>
            <View style={styles.currentScheduleBadge}>
              <Clock3 size={16} color={colors.secondary} />
            </View>
          </View>

          <View style={styles.stepperRow}>
            <View style={styles.stepperStep}>
              <View style={styles.stepperStepActive}>
                <Text style={styles.stepperStepActiveText}>1</Text>
              </View>
              <Text style={styles.stepperLabelActive}>
                {t('customer.bookings.stepChooseDay', 'Өдөр сонгох')}
              </Text>
            </View>
            <View style={styles.stepperLine} />
            <View style={[styles.stepperStep, styles.stepperStepDisabled]}>
              <View style={styles.stepperStepInactive}>
                <Text style={styles.stepperStepInactiveText}>2</Text>
              </View>
              <Text style={styles.stepperLabelInactive}>
                {t('customer.bookings.stepConfirm', 'Баталгаажуулах')}
              </Text>
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>{formatMonthTitle(visibleMonth)}</Text>
              <View style={styles.calendarControls}>
                <Pressable style={styles.calendarControlButton} accessibilityRole="button">
                  <ChevronLeftIcon size={18} color={colors.primaryDeep} />
                </Pressable>
                <Pressable style={styles.calendarControlButton} accessibilityRole="button">
                  <ChevronRight size={18} color={colors.primaryDeep} />
                </Pressable>
              </View>
            </View>

            <View style={styles.weekdaysRow}>
              {['Да', 'Мя', 'Лха', 'Пү', 'Ба', 'Бя', 'Ня'].map((day) => (
                <Text key={day} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarCells.map((cell, index) => {
                if (!cell) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const isSelected = sameDay(cell, selectedDateTime);
                const isTomorrow = sameDay(cell, tomorrow);
                const isPast = cell < tomorrow;
                const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
                return (
                  <Pressable
                    key={cell.toISOString()}
                    onPress={() => updateSelectedDay(cell)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isPast && styles.dayCellDisabled,
                    ]}
                    testID={isSelected ? 'reschedule-screen-date-picker' : undefined}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: isPast }}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.dayNumberSelected,
                        isPast && styles.dayNumberDisabled,
                        isWeekend && !isSelected && styles.dayNumberWeekend,
                        isTomorrow && !isSelected && styles.dayNumberTomorrow,
                      ]}
                    >
                      {cell.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Clock3 size={14} color={colors.primaryDeep} />
              <Text style={styles.sectionTitle}>
                {t('customer.bookings.sectionAvailableTimes', 'Боломжит цагууд')}
              </Text>
            </View>
            <View style={styles.timeRow}>
              {['09:00', '10:00', '11:00', '14:00', '15:00'].map((time) => {
                const isSelected =
                  formatDateTime(selectedDateTime).endsWith(` ${time}`) ||
                  (time === '10:00' && formatDateTime(selectedDateTime).endsWith(' 10:00'));
                return (
                  <Pressable
                    key={time}
                    onPress={() => updateSelectedTime(time)}
                    style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                      {time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.reasonLabel}>
              {t('customer.bookings.labelReason', 'Шалтгаан (заавал биш)')}
            </Text>
            <View style={styles.reasonInputWrap}>
              <Input
                style={styles.reasonInput}
                placeholder={t(
                  'customer.bookings.placeholderReason',
                  'Яагаад цагаа өөрчлөх болсон талаар бичнэ үү...',
                )}
                placeholderTextColor={colors.chipInactive}
                value={reason}
                onChangeText={setReason}
                maxLength={200}
                multiline
                numberOfLines={4}
                testID="reschedule-screen-reason"
              />
            </View>
            <Text style={styles.reasonHelper}>
              {t('customer.bookings.helperReason', 'Заавал биш')}
            </Text>
          </View>

          <View style={styles.infoTip}>
            <Info size={16} color={colors.primaryDeep} />
            <Text style={styles.infoTipText}>
              {t(
                'customer.bookings.scheduleAuthorityNote',
                'Цагийн өөрчлөлт зөвхөн нөгөө тал зөвшөөрсний дараа хүчинтэй болно',
              )}
            </Text>
          </View>

          {requestState !== 'request_form' ? (
            <View style={styles.stateCard}>
              <View style={styles.stateBadge}>
                <CalendarRange size={18} color={colors.secondary} />
              </View>
              <Text style={styles.stateTitle}>
                {requestState === 'awaiting_response'
                  ? t('customer.bookings.statusAwaiting', 'Хүлээж байна')
                  : requestState === 'accepted'
                    ? t('customer.bookings.statusAccepted', 'Зөвшөөрсөн')
                    : requestState === 'declined'
                      ? t('customer.bookings.statusDeclined', 'Татгалзсан')
                      : t('customer.bookings.statusExpired', 'Хугацаа дууссан')}
              </Text>
              <Text style={styles.stateMessage}>
                {requestState === 'awaiting_response'
                  ? t(
                      'customer.bookings.awaitingMessage',
                      'Таны хүсэлт илгээгдсэн. Нөгөө тал зөвшөөрөхийг хүлээж байна.',
                    )
                  : requestState === 'accepted'
                    ? t(
                        'customer.bookings.acceptedMessage',
                        'Шинэ цаг баталгаажлаа. Ирэх цагийн сануулга шинэчлэгдлээ.',
                      )
                    : requestState === 'declined'
                      ? t(
                          'customer.bookings.declinedMessage',
                          'Хүсэлт татгалзсан. Анхны товлосон цаг хүчинтэй хэвээр.',
                        )
                      : t(
                          'customer.bookings.expiredMessage',
                          'Хүсэлтийн хугацаа дууссан. Анхны товлосон цаг хүчинтэй хэвээр.',
                        )}
              </Text>
            </View>
          ) : null}
      </InsetScrollView>

      <StickyActionBar>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleSubmit()}
            style={styles.submitButtonWrap}
            testID="reschedule-screen-next"
            disabled={isPending}
          >
            <LinearGradient
              colors={[colors.primaryDeep, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {t('customer.bookings.ctaSubmitReschedule', 'Хүсэлт илгээх')}
              </Text>
              <ArrowRight size={18} color={colors.primaryForeground} />
            </LinearGradient>
          </Pressable>
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  currentScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  currentScheduleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  currentScheduleLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  currentScheduleValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentScheduleValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  currentScheduleBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  stepperStep: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperStepDisabled: {
    opacity: 0.45,
  },
  stepperStepActive: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperStepActiveText: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  stepperStepInactive: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperStepInactiveText: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  stepperLabelActive: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  stepperLabelInactive: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  stepperLine: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.border,
  },
  calendarCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...elevations.soft,
    gap: spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  calendarControls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  calendarControlButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.micro,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  dayCellSelected: {
    backgroundColor: colors.primaryDeep,
    ...elevations.soft,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayNumber: {
    fontSize: typography.label,
    color: colors.primaryDeep,
    fontWeight: '500',
  },
  dayNumberSelected: {
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  dayNumberDisabled: {
    color: colors.textSecondary,
  },
  dayNumberWeekend: {
    color: colors.danger,
  },
  dayNumberTomorrow: {
    color: colors.danger,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    minWidth: 72,
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  timeChipSelected: {
    backgroundColor: colors.primaryDeep,
    ...elevations.soft,
  },
  timeChipText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  timeChipTextSelected: {
    color: colors.primaryForeground,
  },
  reasonLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  reasonInputWrap: {
    minHeight: 120,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reasonInput: {
    minHeight: 96,
    color: colors.primaryDeep,
    fontSize: typography.body,
    textAlignVertical: 'top',
  },
  reasonHelper: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  infoTip: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoTipText: {
    flex: 1,
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.5,
    color: colors.primaryDeep,
  },
  stateCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  stateBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  stateMessage: {
    fontSize: typography.label,
    color: colors.textSecondary,
    lineHeight: typography.label * 1.5,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  submitButtonWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  submitButton: {
    minHeight: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
});

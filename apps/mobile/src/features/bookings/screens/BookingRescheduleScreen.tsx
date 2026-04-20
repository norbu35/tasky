import React from 'react';

import { mobileTheme } from '@/design/tokenAdapter';

import {
  ScreenContainer,
  InsetScrollView,
  CurrentScheduleCard,
  StepIndicator,
  DatePicker,
  TimeSlotList,
  ReasonInput,
  PolicyNote,
  RequestStateCard,
  SubmitButton,
} from './BookingReschedule.parts';
import { useBookingReschedule } from './useBookingReschedule';

const { spacing } = mobileTheme;

export default function BookingRescheduleScreen() {
  const {
    selectedDateTime,
    reason,
    requestState,
    tomorrow,
    visibleMonth,
    calendarCells,
    weekdayLabels,
    scheduledAtLabel,
    isPending,
    setReason,
    updateSelectedTime,
    updateSelectedDay,
    handleSubmit,
  } = useBookingReschedule();

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
        <CurrentScheduleCard scheduledAtLabel={scheduledAtLabel} />
        <StepIndicator />
        <DatePicker
          visibleMonth={visibleMonth}
          calendarCells={calendarCells}
          weekdayLabels={weekdayLabels}
          selectedDateTime={selectedDateTime}
          tomorrow={tomorrow}
          onSelectDay={updateSelectedDay}
        />
        <TimeSlotList selectedDateTime={selectedDateTime} onSelectTime={updateSelectedTime} />
        <ReasonInput reason={reason} onReasonChange={setReason} />
        <PolicyNote />
        <RequestStateCard requestState={requestState} />
      </InsetScrollView>
      <SubmitButton isPending={isPending} onSubmit={handleSubmit} />
    </ScreenContainer>
  );
}

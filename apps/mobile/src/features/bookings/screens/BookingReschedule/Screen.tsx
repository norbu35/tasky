import React from 'react';

import { ScreenContainer, InsetScrollView } from '@/components/shells';
import { mobileTheme } from '@/design/tokenAdapter';

import { CurrentScheduleCard } from './CurrentSchedule';
import { StepIndicator, PolicyNote } from './InfoBanners';
import { ReasonInput } from './ReasonInput';
import { ScheduleFields } from './ScheduleFields';
import { RequestStateCard, SubmitButton } from './SubmitAction';
import { useBookingRescheduleScreen } from './useBookingRescheduleScreen';

const { spacing } = mobileTheme;

export default function BookingRescheduleScreen() {
  const {
    selectedDate,
    selectedTime,
    activePicker,
    reason,
    requestState,
    scheduledAtLabel,
    submitError,
    isPending,
    setReason,
    openPicker,
    handlePickerModeChange,
    handlePickerDateChange,
    handlePickerTimeChange,
    handlePickerReset,
    handlePickerCancel,
    handlePickerConfirm,
    handleSubmit,
  } = useBookingRescheduleScreen();
  const isRequestForm = requestState === 'request_form';

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
        extraBottomInset={isRequestForm ? 120 : 24}
      >
        <CurrentScheduleCard scheduledAtLabel={scheduledAtLabel} />
        <RequestStateCard requestState={requestState} />

        {isRequestForm ? (
          <>
            <StepIndicator />
            <ScheduleFields
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              activePicker={activePicker}
              onOpenPicker={openPicker}
              onPickerModeChange={handlePickerModeChange}
              onPickerDateChange={handlePickerDateChange}
              onPickerTimeChange={handlePickerTimeChange}
              onPickerReset={handlePickerReset}
              onPickerCancel={handlePickerCancel}
              onPickerConfirm={handlePickerConfirm}
            />
            <ReasonInput reason={reason} onReasonChange={setReason} />
          </>
        ) : null}

        <PolicyNote />
      </InsetScrollView>
      {isRequestForm ? (
        <SubmitButton isPending={isPending} submitError={submitError} onSubmit={handleSubmit} />
      ) : null}
    </ScreenContainer>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { PostingGuidanceCard } from '@/features/tasks/components/PostingGuidance';

import { PricingModeSelector, QuoteModeNotice } from './TaskSchedule.PricingMode';
import { DateCard, BudgetField, PickerSection } from './TaskSchedule.ScheduleForm';
import { useTaskScheduleScreen } from './useTaskScheduleScreen';

export default function TaskScheduleScreen() {
  const { t } = useTranslation();
  const {
    selectedDate,
    selectedTime,
    activePicker,
    pricingMode,
    budget,
    budgetError,
    scheduleError,
    canContinue,
    openPicker,
    handlePickerModeChange,
    handlePickerDateChange,
    handlePickerTimeChange,
    handlePickerReset,
    handlePickerCancel,
    handlePickerConfirm,
    setPricingMode,
    handleBudgetChange,
    handleBudgetBlur,
    handleNext,
    goBack,
  } = useTaskScheduleScreen();

  return (
    <FormWizardTemplate
      testID="SCR-CUST-006"
      currentStep={4}
      totalSteps={7}
      onNext={handleNext}
      onBack={goBack}
      nextLabel={t('common.continue')}
      nextDisabled={!canContinue}
      title={t('ScheduleBudgetScreen.schedulePageTitle')}
      subtitle={t('ScheduleBudgetScreen.scheduleInstruction')}
    >
      <DateCard
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        scheduleError={scheduleError}
        onOpenPicker={openPicker}
      />

      <PostingGuidanceCard
        titleKey="PostingGuidance.pricingTitle"
        bodyKey="PostingGuidance.pricingBody"
        testID="posting-guidance-pricing"
      />

      <PricingModeSelector pricingMode={pricingMode} onChange={setPricingMode} />

      {pricingMode === 'BUDGET' ? (
        <BudgetField
          budget={budget}
          budgetError={budgetError}
          onBudgetChange={handleBudgetChange}
          onBudgetBlur={handleBudgetBlur}
        />
      ) : (
        <QuoteModeNotice />
      )}

      <PickerSection
        activePicker={activePicker}
        onPickerModeChange={handlePickerModeChange}
        onPickerDateChange={handlePickerDateChange}
        onPickerTimeChange={handlePickerTimeChange}
        onPickerReset={handlePickerReset}
        onPickerCancel={handlePickerCancel}
        onPickerConfirm={handlePickerConfirm}
      />
    </FormWizardTemplate>
  );
}

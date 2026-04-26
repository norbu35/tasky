import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

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
    handlePickerChange,
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
    >
      <View className="gap-sm" testID="schedule-header">
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('ScheduleBudgetScreen.schedulePageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('ScheduleBudgetScreen.scheduleInstruction')}
        </Text>
      </View>

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
        onPickerChange={handlePickerChange}
        onPickerCancel={handlePickerCancel}
        onPickerConfirm={handlePickerConfirm}
      />
    </FormWizardTemplate>
  );
}

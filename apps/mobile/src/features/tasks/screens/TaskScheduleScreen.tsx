import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';

import { DateCard, BudgetField, PickerSection } from './TaskSchedule.parts';
import { useTaskSchedule } from './useTaskSchedule';

export default function ScheduleBudgetScreen() {
  const { t } = useTranslation();
  const {
    selectedDate,
    selectedTime,
    activePicker,
    budget,
    budgetError,
    scheduleError,
    canContinue,
    openPicker,
    handlePickerChange,
    handlePickerCancel,
    handlePickerConfirm,
    handleBudgetChange,
    handleBudgetBlur,
    handleNext,
    goBack,
  } = useTaskSchedule();

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

      <BudgetField
        budget={budget}
        budgetError={budgetError}
        onBudgetChange={handleBudgetChange}
        onBudgetBlur={handleBudgetBlur}
      />

      <PickerSection
        activePicker={activePicker}
        onPickerChange={handlePickerChange}
        onPickerCancel={handlePickerCancel}
        onPickerConfirm={handlePickerConfirm}
      />
    </FormWizardTemplate>
  );
}

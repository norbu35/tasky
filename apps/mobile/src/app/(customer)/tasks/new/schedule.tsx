import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, typography } = mobileTheme;

const MIN_BUDGET = 1001;

export default function ScheduleBudgetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    photos: string;
    location: string;
  }>();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetError, setBudgetError] = useState('');

  const handleNext = () => {
    const budgetNum = Number(budget);
    if (!budget || isNaN(budgetNum) || budgetNum < MIN_BUDGET) {
      setBudgetError(t('customer.postTask.budgetError', 'Budget must be at least \u20AE1,001'));
      return;
    }
    setBudgetError('');
    router.push({
      pathname: '/(customer)/tasks/new/review',
      params: {
        categoryId: params.categoryId,
        description: params.description,
        photos: params.photos,
        location: params.location,
        date,
        time,
        budget,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={3}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={t('common.next', 'Next')}
      testID="schedule-budget-screen"
    >
      <Text style={styles.title}>{t('customer.postTask.scheduleTitle', 'When & Budget')}</Text>

      <FormField label={t('customer.postTask.scheduleDate', 'Date')}>
        <Input
          testID="schedule-date-input"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </FormField>

      <FormField label={t('customer.postTask.scheduleTime', 'Time')}>
        <Input
          testID="schedule-time-input"
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
        />
      </FormField>

      <FormField
        label={t('customer.postTask.budgetLabel', 'Budget')}
        errorText={budgetError || undefined}
        helperText={t(
          'customer.postTask.budgetHelper',
          'Enter a fixed amount. Minimum: \u20AE1,001',
        )}
      >
        <Input
          testID="schedule-budget-input"
          value={budget}
          onChangeText={(text: string) => {
            setBudget(text);
            if (budgetError) setBudgetError('');
          }}
          placeholder={t('customer.postTask.budgetPlaceholder', '\u20AE Amount')}
          keyboardType="numeric"
          invalid={!!budgetError}
        />
      </FormField>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
});

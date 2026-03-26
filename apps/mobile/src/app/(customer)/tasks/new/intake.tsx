import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function IntakeFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!description.trim()) {
      setError(t('customer.postTask.validation.required', 'This field is required'));
      return;
    }
    setError('');
    router.push({
      pathname: '/(customer)/tasks/new/photos',
      params: { categoryId: params.categoryId, description },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={t('common.continue', 'Continue')}
      testID="intake-form-screen"
    >
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{t('customer.postTask.intakePageTitle', 'Task Details')}</Text>
        <Text style={styles.instruction}>
          {t('customer.postTask.intakeInstruction', 'Fill in the task details')}
        </Text>
      </View>
      <FormField
        label={t('customer.postTask.intakeDescription', 'Description')}
        errorText={error || undefined}
      >
        <Input
          testID="intake-description-input"
          value={description}
          onChangeText={(text: string) => {
            setDescription(text);
            if (error) setError('');
          }}
          placeholder={t('customer.postTask.intakePlaceholder', 'What needs to be done?')}
          multiline
          numberOfLines={4}
          maxLength={500}
          invalid={!!error}
        />
      </FormField>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
  },
  instruction: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
});

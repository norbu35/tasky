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
  const stepLabel = t('taskPost.step', 'Step {{current}} of {{total}}')
    .replace('{{current}}', '2')
    .replace('{{total}}', '7');
  const descriptionLength = description.length;

  const handleNext = () => {
    if (!description.trim()) {
      setError(t('customer.postTask.validation.required', 'This field is required'));
      return;
    }
    setError('');
    router.push({
      pathname: '/(customer)/tasks/new/photos',
      params: {
        categoryId: params.categoryId,
        description,
        intakeAnswers: JSON.stringify({ description }),
        intakeSchemaVersion: '1',
      },
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
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <Text style={styles.title}>{t('customer.postTask.intakePageTitle', 'Task Details')}</Text>
        <Text style={styles.instruction}>
          {t('customer.postTask.intakeInstruction', 'Fill in the task details')}
        </Text>
      </View>
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>
          {t('customer.postTask.intakeTipTitle', 'Better details lead to better offers')}
        </Text>
        <Text style={styles.tipBody}>
          {t(
            'customer.postTask.intakeTipBody',
            'Mention the size of the job, access notes, and anything the Tasker should prepare.',
          )}
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
          style={styles.descriptionInput}
        />
        <View style={styles.fieldMeta}>
          <Text style={styles.fieldHint}>
            {t(
              'customer.postTask.intakeHint',
              'Include size, access, timing, and any tools or materials involved.',
            )}
          </Text>
          <Text style={styles.counter}>{`${descriptionLength} / 500`}</Text>
        </View>
      </FormField>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
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
  tipCard: {
    borderRadius: mobileTheme.radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  tipTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  tipBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
  descriptionInput: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  fieldMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  fieldHint: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
  counter: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
});

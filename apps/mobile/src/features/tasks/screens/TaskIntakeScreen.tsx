import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

import { SchemaFieldRenderer } from './TaskIntake.parts';
import { useTaskIntake } from './useTaskIntake';

export default function TaskIntakeScreen() {
  const { t } = useTranslation();
  const {
    description,
    descriptionError,
    answers,
    fieldErrors,
    schema,
    intakeEnabled,
    locale,
    maxDescriptionLength,
    setField,
    handleDescriptionChange,
    handleNext,
    goBack,
  } = useTaskIntake();

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onBack={goBack}
      nextLabel={t('common.continue')}
      testID="SCR-CUST-003"
    >
      <View className="gap-sm pt-sm" testID="intake-header">
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('Intake.intakePageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('Intake.intakeInstruction')}
        </Text>
      </View>

      <FormField label={t('Intake.intakeDescription')} errorText={descriptionError || undefined}>
        <Input
          testID="intake-description-input"
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder={t('Intake.intakePlaceholder')}
          multiline
          numberOfLines={4}
          maxLength={maxDescriptionLength}
          invalid={!!descriptionError}
          style={{ minHeight: 160, textAlignVertical: 'top' }}
        />
        <View className="flex-row justify-end">
          <Text className="text-caption font-bold text-muted-foreground">
            {`${description.length} / ${maxDescriptionLength}`}
          </Text>
        </View>
      </FormField>

      {intakeEnabled && schema
        ? schema.map((field) => (
            <SchemaFieldRenderer
              key={field.key ?? field.name}
              field={field}
              answers={answers}
              fieldErrors={fieldErrors}
              locale={locale}
              onFieldChange={setField}
            />
          ))
        : null}
    </FormWizardTemplate>
  );
}

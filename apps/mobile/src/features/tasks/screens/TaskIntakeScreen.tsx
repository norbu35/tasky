import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PostingGuidanceCard } from '@/features/tasks/components/PostingGuidance';

import { SchemaFieldRenderer } from './TaskIntake.SchemaFieldRenderer';
import { useTaskIntakeScreen } from './useTaskIntakeScreen';

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
  } = useTaskIntakeScreen();

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onBack={goBack}
      nextLabel={t('common.continue')}
      title={t('Intake.intakePageTitle')}
      subtitle={t('Intake.intakeInstruction')}
      testID="SCR-CUST-003"
    >
      <PostingGuidanceCard
        titleKey="PostingGuidance.structuredTitle"
        bodyKey="PostingGuidance.structuredBody"
        testID="posting-guidance-intake-structured"
      />

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

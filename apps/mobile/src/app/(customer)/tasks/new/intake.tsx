import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';

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
      currentStep={0}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={t('common.next', 'Next')}
      testID="intake-form-screen"
    >
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

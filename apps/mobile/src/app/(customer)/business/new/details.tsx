import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';

export default function BusinessDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');

  // TODO: wire real data — save business details

  return (
    <FormWizardTemplate
      currentStep={0}
      totalSteps={3}
      onNext={() => router.push('/(customer)/business/new/location')}
      nextLabel={t('common.continue', 'Continue')}
      nextDisabled={!name.trim()}
      showBack={false}
      testID="SCR-B2B-002"
    >
      <FormField label={t('b2b.setup.businessName', 'Business Name')}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t('b2b.setup.businessNamePlaceholder', 'Enter business name')}
          testID="b2b-business-name-input"
        />
      </FormField>
    </FormWizardTemplate>
  );
}

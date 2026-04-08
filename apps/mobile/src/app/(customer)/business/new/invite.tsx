import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';

export default function BusinessInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');

  // TODO: wire real data — send manager invite

  return (
    <FormWizardTemplate
      currentStep={2}
      totalSteps={3}
      onNext={() => router.replace('/(customer)/business')}
      onBack={() => router.back()}
      nextLabel={t('b2b.setup.finishSetup')}
      testID="SCR-B2B-004"
    >
      <FormField label={t('b2b.setup.managerEmail')}>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder={t('b2b.setup.managerEmailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="b2b-manager-email-input"
        />
      </FormField>
    </FormWizardTemplate>
  );
}

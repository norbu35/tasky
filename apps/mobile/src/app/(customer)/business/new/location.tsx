import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';

export default function BusinessLocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [address, setAddress] = useState('');

  // TODO: wire real data — save business location

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={3}
      onNext={() => router.push('/(customer)/business/new/invite')}
      onBack={() => router.back()}
      nextLabel={t('common.continue')}
      nextDisabled={!address.trim()}
      testID="SCR-B2B-003"
    >
      <FormField label={t('b2b.setup.businessAddress')}>
        <Input
          value={address}
          onChangeText={setAddress}
          placeholder={t('b2b.setup.businessAddressPlaceholder')}
          testID="b2b-business-address-input"
        />
      </FormField>
    </FormWizardTemplate>
  );
}

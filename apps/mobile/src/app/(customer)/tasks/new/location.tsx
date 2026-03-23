import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function LocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    photos: string;
  }>();
  const [locationText, setLocationText] = useState('');

  const handleNext = () => {
    router.push({
      pathname: '/(customer)/tasks/new/schedule',
      params: {
        categoryId: params.categoryId,
        description: params.description,
        photos: params.photos,
        location: locationText,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={2}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={t('common.next', 'Next')}
      testID="location-screen"
    >
      <Text style={styles.title}>{t('customer.postTask.locationTitle', 'Where?')}</Text>
      <FormField
        label={t('customer.postTask.locationLabel', 'Location details')}
        helperText={t('customer.postTask.locationHelper', 'Provide details helpful for the Tasker')}
      >
        <Input
          testID="location-text-input"
          value={locationText}
          onChangeText={setLocationText}
          placeholder={t('customer.postTask.locationPlaceholder', 'Enter location')}
          maxLength={100}
        />
      </FormField>
      <Text style={styles.privacyNote}>
        {t(
          'customer.postTask.locationPrivacy',
          'Taskers see approximate location. Exact address shown after booking confirmation',
        )}
      </Text>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  privacyNote: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    lineHeight: typography.caption * 1.6,
  },
});

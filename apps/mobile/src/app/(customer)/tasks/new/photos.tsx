import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { PhotoGrid } from '../../../../components/ui/PhotoGrid';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function PhotoUploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string; description: string }>();
  const [photos] = useState<string[]>([]);

  const handleAddPhoto = () => {
    // In production, this would open camera/gallery picker
    // For now, this is a placeholder
  };

  const handleNext = () => {
    router.push({
      pathname: '/(customer)/tasks/new/location',
      params: {
        categoryId: params.categoryId,
        description: params.description,
        photos: JSON.stringify(photos),
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={
        photos.length > 0 ? t('common.next', 'Next') : t('customer.postTask.photosSkip', 'Skip')
      }
      testID="photo-upload-screen"
    >
      <Text style={styles.title}>{t('customer.postTask.photosTitle', 'Add Photos')}</Text>
      <Text style={styles.subtitle}>
        {t('customer.postTask.photosDescription', 'Help Taskers understand the job')}
      </Text>
      <PhotoGrid
        photos={photos}
        maxPhotos={3}
        onAddPhoto={handleAddPhoto}
        showAddButton
        testID="photo-upload-grid"
      />
      <View style={styles.addButtonContainer}>
        <Text style={styles.addButtonText} onPress={handleAddPhoto} testID="photo-add-button">
          {t('customer.postTask.photosAdd', 'Add Photo')}
        </Text>
      </View>
      <Text style={styles.helperText}>
        {t('customer.postTask.photosOptional', 'Photos are optional — you can skip')}
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
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  addButtonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.accent,
  },
  helperText: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});

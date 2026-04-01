import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { PhotoGrid } from '../../../../components/ui/PhotoGrid';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

function parsePhotoKeys(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default function PhotoUploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    photos?: string;
  }>();
  const [photos] = useState<string[]>(() => parsePhotoKeys(params.photos));
  const stepLabel = t('taskPost.step', 'Step {{current}} of {{total}}')
    .replace('{{current}}', '3')
    .replace('{{total}}', '7');

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
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
        photos: JSON.stringify(photos),
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={2}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={
        photos.length > 0 ? t('common.continue', 'Continue') : t('customer.postTask.photosSkip', 'Skip')
      }
      testID="photo-upload-screen"
    >
      <Text style={styles.stepLabel}>{stepLabel}</Text>
      <Text style={styles.title}>{t('customer.postTask.photosTitle', 'Add Photos')}</Text>
      <Text style={styles.subtitle}>
        {t('customer.postTask.photosInstruction', 'Add photos related to your task (up to 3)')}
      </Text>
      <PhotoGrid
        photos={photos}
        maxPhotos={3}
        onAddPhoto={handleAddPhoto}
        showAddButton
        testID="photo-upload-grid"
      />
      <Text style={styles.helperText}>
        {t('customer.postTask.photosOptional', 'Photos are optional — you can skip')}
      </Text>
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>
          {t('customer.postTask.photosTipTitle', 'Photo tip')}
        </Text>
        <Text style={styles.tipBody}>
          {t(
            'customer.postTask.photosTipBody',
            'Natural light and wide shots help Taskers price the work more accurately.',
          )}
        </Text>
      </View>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  helperText: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
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
});

import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CircleX, Info, Plus } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

function parsePhotoKeys(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
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
  const [photos, setPhotos] = useState<string[]>(() => parsePhotoKeys(params.photos).slice(0, 3));
  const slots = useMemo(
    () => Array.from({ length: 3 }, (_, index) => photos[index] ?? null),
    [photos],
  );

  const handleAddPhoto = () => {
    // Photo picker integration is not yet wired in this lane.
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
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

  return (
    <FormWizardTemplate testID="SCR-CUST-004"
      currentStep={2}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={
        photos.length > 0
          ? t('common.continue', 'Continue')
          : t('customer.postTask.photosSkip', 'Skip')
      }
    >
      <View style={styles.progressHeader}>
        <Text style={styles.stepLabel}>
          {t('taskPost.step', 'Step {{current}} of {{total}}')
            .replace('{{current}}', '3')
            .replace('{{total}}', '7')}
        </Text>
        <Text style={styles.progressHint}>
          {t('customer.postTask.photosProgressHint', 'Almost done')}
        </Text>
      </View>
      <Text style={styles.title}>
        {t('customer.postTask.photosHeroTitle', 'Show your task workspace')}
      </Text>
      <Text style={styles.subtitle}>
        {t('customer.postTask.photosInstruction', 'Add photos related to your task (up to 3)')}
      </Text>

      <View style={styles.grid} testID="photo-upload-grid">
        {slots.map((photoUri, index) =>
          photoUri ? (
            <View key={`photo-${index}`} style={styles.photoCard}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <Pressable
                onPress={() => handleRemovePhoto(index)}
                style={styles.removeButton}
                testID={`photo-upload-remove-${index}`}
                accessibilityRole="button"
                accessibilityLabel={t('customer.postTask.removePhoto', 'Remove photo')}
              >
                <CircleX size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={`add-${index}`}
              style={styles.addCard}
              onPress={handleAddPhoto}
              testID={`photo-upload-add-${index}`}
              accessibilityRole="button"
              accessibilityLabel={t('common.addPhoto', 'Add Photo')}
            >
              <View style={styles.addIconWrap}>
                <Plus size={20} color={colors.primaryDeep} />
              </View>
              <Text style={styles.addLabel}>{t('common.addPhoto', 'Add Photo')}</Text>
            </Pressable>
          ),
        )}
      </View>

      <View style={styles.helperRow}>
        <Info size={16} color={colors.secondary} />
        <Text style={styles.helperText}>
          {t('customer.postTask.photosOptional', 'Photos are optional — you can skip')}
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>{t('customer.postTask.photosTipTitle', 'Photo tip')}</Text>
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
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  progressHint: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
    lineHeight: typography.heroTitle * 1.22,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoCard: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  photo: {
    alignSelf: 'stretch',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primaryDeep}99`,
  },
  addCard: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.chipInactive,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
  },
  addLabel: {
    fontSize: typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  helperText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  tipCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.muted,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tipTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  tipBody: {
    fontSize: typography.caption,
    color: colors.primary,
    lineHeight: typography.caption * 1.6,
  },
});

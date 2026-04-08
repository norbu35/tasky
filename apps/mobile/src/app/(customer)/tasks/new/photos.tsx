import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CircleX, Info, Plus } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

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
    <FormWizardTemplate
      testID="SCR-CUST-004"
      currentStep={2}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={
        photos.length > 0
          ? t('common.continue')
          : t('Photos.photosSkip')
      }
    >
      <View className="flex-row items-center justify-between gap-sm">
        <Text className="text-caption text-textSecondary">
          {t('Photos.photosProgressHint')}
        </Text>
      </View>
      <Text className="text-heading font-sans-bold text-primaryDeep" style={{ lineHeight: 26 }}>
        {t('Photos.photosHeroTitle')}
      </Text>
      <Text className="text-body text-textSecondary leading-[24px]">
        {t('Photos.photosInstruction')}
      </Text>

      <View className="flex-row flex-wrap gap-sm" testID="photo-upload-grid">
        {slots.map((photoUri, index) =>
          photoUri ? (
            <View
              key={`photo-${index}`}
              className="rounded-lg overflow-hidden bg-muted"
              style={{ width: '31.5%', aspectRatio: 1 }}
            >
              <Image source={{ uri: photoUri }} style={{ alignSelf: 'stretch', height: '100%' }} />
              <Pressable
                onPress={() => handleRemovePhoto(index)}
                className="absolute items-center justify-center rounded-full"
                style={{
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  backgroundColor: `${colors.primaryDeep}99`,
                }}
                testID={`photo-upload-remove-${index}`}
                accessibilityRole="button"
                accessibilityLabel={t('Photos.removePhoto')}
              >
                <CircleX size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={`add-${index}`}
              className="rounded-lg border-2 border-dashed border-chipInactive bg-muted items-center justify-center gap-xs p-sm"
              style={{ width: '31.5%', aspectRatio: 1 }}
              onPress={handleAddPhoto}
              testID={`photo-upload-add-${index}`}
              accessibilityRole="button"
              accessibilityLabel={t('Photos.addPhoto')}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}14` }}
              >
                <Plus size={20} color={colors.primaryDeep} />
              </View>
              <Text className="text-caption text-primaryDeep font-sans-bold uppercase text-center">
                {t('Photos.addPhoto')}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <View className="flex-row items-center gap-sm px-xs">
        <Info size={16} color={colors.secondary} />
        <Text className="flex-1 text-caption text-textSecondary">
          {t('Photos.photosOptional')}
        </Text>
      </View>

      <View className="rounded-lg p-lg bg-muted gap-sm mt-xs">
        <Text className="text-body font-sans-bold text-primaryDeep">
          {t('Photos.photosTipTitle')}
        </Text>
        <Text className="text-caption text-primary leading-[20px]">
          {t('Photos.photosTipBody')}
        </Text>
      </View>
    </FormWizardTemplate>
  );
}

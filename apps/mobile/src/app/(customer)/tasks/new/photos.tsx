import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CircleX, Info, Loader, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { useTaskPhotoUpload } from '@/features/tasks/hooks/useTaskPhotoUpload';

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
    categoryName?: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    intakeSchemaJson?: string;
    photos?: string;
  }>();
  const [photos, setPhotos] = useState<string[]>(() => parsePhotoKeys(params.photos).slice(0, 3));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { uploadPhoto } = useTaskPhotoUpload();

  const slots = useMemo(
    () => Array.from({ length: 3 }, (_, index) => photos[index] ?? null),
    [photos],
  );

  const handleAddPhoto = async (slotIndex: number) => {
    if (photos.length >= 3) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('Photos.permissionTitle'), t('Photos.permissionBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const uri = result.assets[0].uri;
    setUploadingIndex(slotIndex);
    try {
      const storageKey = await uploadPhoto(uri);
      setPhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = storageKey;
        return next.filter(Boolean) as string[];
      });
    } catch {
      Alert.alert(t('common.error'), t('Photos.uploadError'));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleNext = () => {
    router.push({
      pathname: '/(customer)/tasks/new/location',
      params: {
        categoryId: params.categoryId,
        categoryName: params.categoryName ?? '',
        description: params.description,
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
        intakeSchemaJson: params.intakeSchemaJson,
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
      nextLabel={photos.length > 0 ? t('common.continue') : t('Photos.photosSkip')}
      nextDisabled={uploadingIndex !== null}
    >
      <View className="flex-row items-center justify-between gap-sm">
        <Text className="text-caption text-text-secondary">{t('Photos.photosProgressHint')}</Text>
      </View>
      <Text className="text-heading font-sans-bold text-primary-deep leading-[26px]">
        {t('Photos.photosHeroTitle')}
      </Text>
      <Text className="text-body text-text-secondary leading-[24px]">
        {t('Photos.photosInstruction')}
      </Text>

      <View className="flex-row flex-wrap gap-sm" testID="photo-upload-grid">
        {slots.map((photoUri, index) =>
          photoUri ? (
            <View
              key={`photo-${index}`}
              className="rounded-lg overflow-hidden bg-muted w-[31.5%] aspect-square"
            >
              <Image source={{ uri: photoUri }} className="self-stretch h-full" />
              <Touchable
                onPress={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors.primaryDeep}99` }}
                testID={`photo-upload-remove-${index}`}
                accessibilityRole="button"
                accessibilityLabel={t('Photos.removePhoto')}
              >
                <CircleX size={16} color={colors.primaryForeground} />
              </Touchable>
            </View>
          ) : (
            <Touchable
              key={`add-${index}`}
              className="rounded-lg border-2 border-dashed border-chip-inactive bg-muted items-center justify-center gap-xs p-sm w-[31.5%] aspect-square"
              onPress={() => handleAddPhoto(index)}
              disabled={uploadingIndex !== null}
              testID={`photo-upload-add-${index}`}
              accessibilityRole="button"
              accessibilityLabel={t('Photos.addPhoto')}
            >
              {uploadingIndex === index ? (
                <Loader size={20} color={colors.primaryDeep} />
              ) : (
                <>
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}14` }}
                  >
                    <Plus size={20} color={colors.primaryDeep} />
                  </View>
                  <Text className="text-caption text-primary-deep font-sans-bold uppercase text-center">
                    {t('Photos.addPhoto')}
                  </Text>
                </>
              )}
            </Touchable>
          ),
        )}
      </View>

      <View className="flex-row items-center gap-sm px-xs">
        <Info size={16} color={colors.secondary} />
        <Text className="flex-1 text-caption text-text-secondary">
          {t('Photos.photosOptional')}
        </Text>
      </View>

      <View className="rounded-lg p-lg bg-muted gap-sm mt-xs">
        <Text className="text-body font-sans-bold text-primary-deep">
          {t('Photos.photosTipTitle')}
        </Text>
        <Text className="text-caption text-primary leading-[20px]">
          {t('Photos.photosTipBody')}
        </Text>
      </View>
    </FormWizardTemplate>
  );
}

import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { FormWizardTemplate } from '../../../components/templates/FormWizardTemplate';
import { useVerification } from '../../../features/verification/hooks/useVerification';
import { useVerificationUpload } from '../../../features/verification/hooks/useVerificationUpload';
import { mobileTheme } from '../../../design/tokenAdapter';
import { Button } from '../../../components/ui/Button';

const { colors } = mobileTheme;

const STEPS = ['FRONT', 'BACK', 'SELFIE'] as const;
type DocumentSide = (typeof STEPS)[number];

const STEP_LABELS: Record<DocumentSide, string> = {
  FRONT: 'tasker.verification.uploadFront',
  BACK: 'tasker.verification.uploadBack',
  SELFIE: 'tasker.verification.uploadSelfie',
};

export default function UploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { submitVerification, isSubmitting } = useVerification();
  const { uploadPhoto } = useVerificationUpload();

  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<Record<DocumentSide, string | null>>({
    FRONT: null,
    BACK: null,
    SELFIE: null,
  });
  const [storageKeys, setStorageKeys] = useState<Record<DocumentSide, string | null>>({
    FRONT: null,
    BACK: null,
    SELFIE: null,
  });

  const currentSide = STEPS[currentStep];
  const currentPhoto = photos[currentSide];
  const hasPhoto = !!currentPhoto;
  const allPhotosCaptured = useMemo(() => STEPS.every((side) => !!photos[side]), [photos]);
  const showReview = currentStep === STEPS.length - 1 && allPhotosCaptured;

  const captureFromCamera = useCallback(async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotos((prev) => ({ ...prev, [currentSide]: uri }));
      try {
        const key = await uploadPhoto(uri, currentSide);
        setStorageKeys((prev) => ({ ...prev, [currentSide]: key }));
      } catch {
        // Upload error handled silently; key remains null.
      }
    }
  }, [currentSide, uploadPhoto]);

  const captureFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotos((prev) => ({ ...prev, [currentSide]: uri }));
      try {
        const key = await uploadPhoto(uri, currentSide);
        setStorageKeys((prev) => ({ ...prev, [currentSide]: key }));
      } catch {
        // Upload error handled silently.
      }
    }
  }, [currentSide, uploadPhoto]);

  const handleRetake = useCallback((side: DocumentSide) => {
    setCurrentStep(STEPS.indexOf(side));
    setPhotos((prev) => ({ ...prev, [side]: null }));
    setStorageKeys((prev) => ({ ...prev, [side]: null }));
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    try {
      await submitVerification({
        id_card_front_key: storageKeys.FRONT ?? '',
        id_card_back_key: storageKeys.BACK ?? '',
        selfie_key: storageKeys.SELFIE ?? '',
      });
      router.replace('/(tasker)/verification/submitted');
    } catch {
      // Submit error handled silently.
    }
  }, [currentStep, storageKeys, submitVerification, router]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return;
    }
    router.back();
  }, [currentStep, router]);

  const isLastStep = currentStep === STEPS.length - 1;
  const nextLabel = isLastStep ? t('tasker.verification.submitButton') : t('common.next');

  return (
    <FormWizardTemplate testID="SCR-TASK-005"
      currentStep={currentStep}
      totalSteps={STEPS.length}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={nextLabel}
      nextDisabled={!hasPhoto}
      nextLoading={isSubmitting}
    >
      <Text className="text-caption font-sans-bold text-textSecondary text-center uppercase tracking-[0.8px] mb-lg">
        {t(STEP_LABELS[currentSide])}
      </Text>

      {currentPhoto ? (
        <View className="items-center mb-lg">
          <Image
            source={{ uri: currentPhoto }}
            className="rounded-md bg-muted"
            style={{ width: 280, height: 200 }}
            testID="photo-preview"
          />
        </View>
      ) : (
        <View className="items-center justify-center h-[200px] bg-muted rounded-md mb-lg">
          <Camera size={48} color={colors.muted} />
          <Text className="text-body text-textSecondary mt-sm">
            {t('tasker.verification.uploadCapture')}
          </Text>
        </View>
      )}

      {showReview ? (
        <View className="gap-md p-lg rounded-md bg-muted" testID="verification-review">
          <Text className="text-subtitle font-semibold text-primary">
            {t('tasker.verification.reviewHeading')}
          </Text>
          <Text className="text-body text-textSecondary leading-[26px]">
            {t('tasker.verification.reviewDescription')}
          </Text>

          <View className="gap-md">
            {(
              [
                ['FRONT', 'review-front-thumb', 'retake-front-btn'],
                ['BACK', 'review-back-thumb', 'retake-back-btn'],
                ['SELFIE', 'review-selfie-thumb', 'retake-selfie-btn'],
              ] as const
            ).map(([side, thumbTestID, buttonTestID]) => (
              <View key={side} className="gap-sm">
                <Image
                  source={{ uri: photos[side] ?? '' }}
                  className="rounded-md bg-muted"
                  style={{ alignSelf: 'stretch', height: 96 }}
                  testID={thumbTestID}
                />
                <Button
                  label={t('tasker.verification.retakeButton')}
                  variant="secondary"
                  size="sm"
                  onPress={() => handleRetake(side)}
                  testID={buttonTestID}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="flex-row gap-md justify-center">
        <Pressable
          className="flex-row items-center gap-sm py-sm px-md rounded-md border border-border bg-card"
          onPress={captureFromCamera}
          testID="capture-camera-btn"
        >
          <Camera size={20} color={colors.primary} />
          <Text className="text-body text-primary">
            {t('tasker.verification.uploadCapture')}
          </Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-sm py-sm px-md rounded-md border border-border bg-card"
          onPress={captureFromGallery}
          testID="capture-gallery-btn"
        >
          <ImageIcon size={20} color={colors.primary} />
          <Text className="text-body text-primary">
            {t('tasker.verification.uploadGallery')}
          </Text>
        </Pressable>
      </View>
    </FormWizardTemplate>
  );
}

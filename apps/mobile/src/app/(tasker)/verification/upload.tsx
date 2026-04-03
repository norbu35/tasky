import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { FormWizardTemplate } from '../../../components/templates/FormWizardTemplate';
import { useVerification } from '../../../features/verification/hooks/useVerification';
import { useVerificationUpload } from '../../../features/verification/hooks/useVerificationUpload';
import { mobileTheme } from '../../../design/tokenAdapter';
import { Button } from '../../../components/ui/Button';

const { colors, spacing, typography, radius } = mobileTheme;

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
    <FormWizardTemplate
      currentStep={currentStep}
      totalSteps={STEPS.length}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={nextLabel}
      nextDisabled={!hasPhoto}
      nextLoading={isSubmitting}
      testID="upload-wizard"
    >
      <Text style={styles.stepLabel}>{t(STEP_LABELS[currentSide])}</Text>

      {currentPhoto ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: currentPhoto }} style={styles.preview} testID="photo-preview" />
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Camera size={48} color={colors.muted} />
          <Text style={styles.placeholderText}>{t('tasker.verification.uploadCapture')}</Text>
        </View>
      )}

      {showReview ? (
        <View style={styles.reviewContainer} testID="verification-review">
          <Text style={styles.reviewHeading}>{t('tasker.verification.reviewHeading')}</Text>
          <Text style={styles.reviewBody}>{t('tasker.verification.reviewDescription')}</Text>

          <View style={styles.reviewGrid}>
            {(
              [
                ['FRONT', 'review-front-thumb', 'retake-front-btn'],
                ['BACK', 'review-back-thumb', 'retake-back-btn'],
                ['SELFIE', 'review-selfie-thumb', 'retake-selfie-btn'],
              ] as const
            ).map(([side, thumbTestID, buttonTestID]) => (
              <View key={side} style={styles.reviewCard}>
                <Image
                  source={{ uri: photos[side] ?? '' }}
                  style={styles.reviewThumb}
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

      <View style={styles.captureButtons}>
        <Pressable
          style={styles.captureBtn}
          onPress={captureFromCamera}
          testID="capture-camera-btn"
        >
          <Camera size={20} color={colors.primary} />
          <Text style={styles.captureBtnText}>{t('tasker.verification.uploadCapture')}</Text>
        </Pressable>

        <Pressable
          style={styles.captureBtn}
          onPress={captureFromGallery}
          testID="capture-gallery-btn"
        >
          <ImageIcon size={20} color={colors.primary} />
          <Text style={styles.captureBtnText}>{t('tasker.verification.uploadGallery')}</Text>
        </Pressable>
      </View>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.lg,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  preview: {
    width: 280,
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  placeholderText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  reviewContainer: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  reviewHeading: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
  },
  reviewGrid: {
    gap: spacing.md,
  },
  reviewCard: {
    gap: spacing.sm,
  },
  reviewThumb: {
    width: '100%',
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  captureBtnText: {
    fontSize: typography.body,
    color: colors.primary,
  },
});

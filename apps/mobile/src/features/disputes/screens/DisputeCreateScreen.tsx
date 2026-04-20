import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { Input } from '@/components/ui/Input';
import { PhotoGrid } from '@/components/ui/PhotoGrid';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { useDisputeCreate } from '@/features/disputes/hooks/useDisputeCreate';

const { colors } = mobileTheme;

const TOTAL_STEPS = 3;

export default function DisputeCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: raiseDispute, isPending } = useDisputeCreate();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [photos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const hasEvidence = photos.length > 0 || description.trim().length > 0;
  const disputeReasons = [
    t('DisputeRaiseScreen.reasonQuality'),
    t('DisputeRaiseScreen.reasonLate'),
    t('DisputeRaiseScreen.reasonIncomplete'),
    t('DisputeRaiseScreen.reasonOther'),
  ] as const;

  const handleNext = useCallback(async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    // Final step: submit
    const idempotencyKey = `dispute-${bookingId}-${Date.now()}`;
    const result = await raiseDispute({
      bookingId,
      reason: selectedReason!,
      idempotencyKey,
    });
    router.replace(`/(customer)/disputes/${result.id}`);
  }, [currentStep, bookingId, selectedReason, raiseDispute, router]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentStep, router]);

  const handleAddPhoto = useCallback(() => {
    // In production, this would open an image picker
  }, []);

  const isNextDisabled =
    (currentStep === 0 && !selectedReason) || (currentStep === TOTAL_STEPS - 1 && !hasEvidence);
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <FormWizardTemplate
      testID="SCR-CUST-024"
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={isLastStep ? t('customer.disputes.ctaSubmit') : t('wizard.next')}
      nextDisabled={isNextDisabled}
      nextLoading={isPending}
      showBack={currentStep > 0}
    >
      <View className="mb-xl">
        <Text className="text-heading font-sans-bold text-primary-deep mb-md">
          {t('customer.disputes.sectionBookingRef')}
        </Text>
        <Text className="text-body text-primary-deep">{bookingId}</Text>
      </View>

      {currentStep === 0 && (
        <View>
          <Text className="text-heading font-sans-bold text-primary-deep mb-md">
            {t('customer.disputes.labelReason')}
          </Text>
          <View className="gap-sm">
            {disputeReasons.map((reason) => (
              <Touchable
                key={reason}
                className={
                  selectedReason === reason
                    ? 'rounded-md p-md bg-card border-[1.5px] border-primary-deep'
                    : 'rounded-md p-md bg-muted border-[1.5px] border-transparent'
                }
                onPress={() => setSelectedReason(reason)}
                testID={`reason-${reason}`}
              >
                <Text
                  className={
                    selectedReason === reason
                      ? 'text-body text-accent font-semibold'
                      : 'text-body text-primary-deep'
                  }
                >
                  {reason}
                </Text>
              </Touchable>
            ))}
          </View>
        </View>
      )}

      {currentStep === 1 && (
        <View>
          <Text className="text-heading font-sans-bold text-primary-deep mb-md">
            {t('customer.disputes.labelEvidence')}
          </Text>
          <PhotoGrid
            photos={photos}
            maxPhotos={5}
            onAddPhoto={handleAddPhoto}
            showAddButton
            testID="dispute-evidence-photos"
          />
          <View className="bg-muted rounded-md p-md mt-md">
            <Text className="text-caption text-text-secondary leading-[20px]">
              {t('DisputeRaiseScreen.validationNoEvidence')}
            </Text>
          </View>
          <Text className="text-caption text-text-secondary mt-sm leading-[20px]">
            {t('customer.disputes.evidenceDeadlineNote')}
          </Text>
        </View>
      )}

      {currentStep === 2 && (
        <View>
          <Text className="text-heading font-sans-bold text-primary-deep mb-md">
            {t('customer.disputes.labelDescription')}
          </Text>
          <Input
            className="border border-border rounded-md p-md text-body text-primary-deep bg-card"
            style={{ minHeight: 120, textAlignVertical: 'top' }}
            placeholder={t('customer.disputes.placeholderDescription')}
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            numberOfLines={5}
            testID="dispute-description-input"
          />
          <Text className="text-caption text-text-secondary mt-sm">
            {t('DisputeRaiseScreen.validationNoEvidence')}
          </Text>
        </View>
      )}
    </FormWizardTemplate>
  );
}

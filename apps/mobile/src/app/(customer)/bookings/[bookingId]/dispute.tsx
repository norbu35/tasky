import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { PhotoGrid } from '../../../../components/ui/PhotoGrid';
import { useDisputeCreate } from '../../../../features/disputes/hooks/useDisputeCreate';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

const TOTAL_STEPS = 3;

const DISPUTE_REASONS = [
  'Poor quality work',
  'Tasker was late',
  'Incomplete work',
  'Other',
] as const;

export default function DisputeRaiseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { mutateAsync: raiseDispute, isPending } = useDisputeCreate();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [photos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const hasEvidence = photos.length > 0 || description.trim().length > 0;

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
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={
        isLastStep ? t('customer.disputes.ctaSubmit', 'Submit Dispute') : t('wizard.next', 'Next')
      }
      nextDisabled={isNextDisabled}
      nextLoading={isPending}
      showBack={currentStep > 0}
      testID="dispute-raise-screen"
    >
      <View style={styles.referenceSection}>
        <Text style={styles.fieldLabel}>
          {t('customer.disputes.sectionBookingRef', 'Booking Reference')}
        </Text>
        <Text style={styles.referenceValue}>{bookingId}</Text>
      </View>

      {currentStep === 0 && (
        <View>
          <Text style={styles.fieldLabel}>{t('customer.disputes.labelReason', 'Issue Type')}</Text>
          <View style={styles.reasonList}>
            {DISPUTE_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
                testID={`reason-${reason}`}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {currentStep === 1 && (
        <View>
          <Text style={styles.fieldLabel}>{t('customer.disputes.labelEvidence', 'Evidence')}</Text>
          <PhotoGrid
            photos={photos}
            maxPhotos={5}
            onAddPhoto={handleAddPhoto}
            showAddButton
            testID="dispute-evidence-photos"
          />
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              {t(
                'customer.disputes.evidenceDeadlineNote',
                'Dispute auto-closes if evidence is not provided within 24 hours',
              )}
            </Text>
          </View>
        </View>
      )}

      {currentStep === 2 && (
        <View>
          <Text style={styles.fieldLabel}>
            {t('customer.disputes.labelDescription', 'Description')}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={t(
              'customer.disputes.placeholderDescription',
              'Describe the issue in detail...',
            )}
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            numberOfLines={5}
            testID="dispute-description-input"
          />
          <Text style={styles.helperText}>
            {t(
              'customer.disputes.validationNoEvidence',
              'At least 1 evidence artifact is required',
            )}
          </Text>
        </View>
      )}
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  referenceSection: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDeep,
    marginBottom: spacing.md,
  },
  referenceValue: {
    fontSize: typography.body,
    color: colors.primaryDeep,
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonOption: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
    backgroundColor: colors.card,
  },
  reasonText: {
    fontSize: typography.body,
    color: colors.primaryDeep,
  },
  reasonTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.primaryDeep,
    backgroundColor: colors.card,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noteContainer: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  helperText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
});

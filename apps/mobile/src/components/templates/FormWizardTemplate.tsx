import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';

const { colors, spacing, radius } = mobileTheme;

const BAR_HEIGHT = 6;

export interface FormWizardTemplateProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
  testID?: string;
}

export function FormWizardTemplate({
  currentStep,
  totalSteps,
  children,
  onNext,
  onBack,
  nextLabel,
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  testID,
}: FormWizardTemplateProps) {
  const { t } = useTranslation();
  const showBackButton = showBack && onBack && (currentStep > 0 || totalSteps === 1);

  return (
    <View style={styles.container} testID={testID}>
      {/* Step Indicator — bar segments */}
      <View
        testID="wizard-progress"
        style={styles.stepIndicator}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${currentStep + 1} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[styles.bar, i <= currentStep ? styles.barFilled : styles.barEmpty]}
          />
        ))}
      </View>

      {/* Scrollable Form Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar — frosted glass */}
      <BlurView intensity={40} tint="light" style={styles.bottomBar} testID="wizard-bottom-bar">
        <View style={styles.bottomBarInner}>
          {showBackButton ? (
            <View style={styles.buttonRow}>
              <Button
                label={t('wizard.back', 'Back')}
                variant="outline"
                onPress={onBack}
                style={styles.backButton}
                testID={testID ? `${testID}-back` : undefined}
              />
              <Button
                label={nextLabel ?? t('wizard.next', 'Next')}
                onPress={onNext}
                disabled={nextDisabled}
                isLoading={nextLoading}
                style={styles.nextButton}
                testID={testID ? `${testID}-next` : undefined}
              />
            </View>
          ) : (
            <Button
              label={nextLabel ?? t('wizard.next', 'Next')}
              onPress={onNext}
              disabled={nextDisabled}
              isLoading={nextLoading}
              style={styles.nextButtonFull}
              testID={testID ? `${testID}-next` : undefined}
            />
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  bar: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: radius.md,
  },
  barFilled: {
    backgroundColor: colors.primary,
  },
  barEmpty: {
    backgroundColor: colors.chipInactive,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  bottomBar: {
    overflow: 'hidden',
  },
  bottomBarInner: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  nextButtonFull: {
    alignSelf: 'stretch',
  },
});

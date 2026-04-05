import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { screenRhythm } from '../../design/screenRhythm';

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
    <ScreenContainer testID={testID}>
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

      {/* Scrollable Form Content + Sticky Bottom Bar */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'height' : 'height'}
        keyboardVerticalOffset={0}
      >
        <InsetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          extraBottomInset={96}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </InsetScrollView>

        {/* Sticky Bottom Bar — frosted glass — inside KAV so it rises above keyboard */}
        <StickyActionBar testID="wizard-bottom-bar">
          <BlurView intensity={40} tint="light" style={styles.bottomBar}>
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
        </StickyActionBar>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
    paddingTop: screenRhythm.contentInsetTop,
    paddingBottom: screenRhythm.itemGap,
    paddingHorizontal: screenRhythm.contentInsetX,
    gap: screenRhythm.stepIndicatorGap,
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
    paddingHorizontal: screenRhythm.contentInsetX,
    gap: screenRhythm.blockGap,
    paddingBottom: screenRhythm.sectionGap,
  },
  bottomBar: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bottomBarInner: {
    paddingTop: screenRhythm.itemGap,
    paddingHorizontal: screenRhythm.contentInsetX,
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

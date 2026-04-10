import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { screenLayout } from '../../design/screenLayout';

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
  /** Override the auto-generated testID for the primary action button (defaults to `${testID}-next`). */
  nextButtonTestID?: string;
  className?: string;
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
  nextButtonTestID,
  className,
}: FormWizardTemplateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [actionBarHeight, setActionBarHeight] = useState(96);
  const showBackButton = showBack && onBack && (currentStep > 0 || totalSteps === 1);
  const effectiveNextTestID = nextButtonTestID ?? (testID ? `${testID}-next` : undefined);

  const handleActionBarLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setActionBarHeight(height);
    }
  };

  return (
    <ScreenContainer testID={testID} className={className}>
      {/* Step Indicator — bar segments + close button */}
      <View className="flex-row items-center pt-header-top pb-item gap-md">
        <View
          testID="wizard-progress"
          className="flex-1 flex-row items-center gap-wizard-step"
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${currentStep + 1} of ${totalSteps}`}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={cn(
                'flex-1 rounded-md',
                i <= currentStep ? 'bg-primary' : 'bg-chipInactive',
              )}
              style={{ height: BAR_HEIGHT }}
            />
          ))}
        </View>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          className="w-8 h-8 items-center justify-center"
          testID="wizard-close"
          accessibilityLabel={t('wizard.close')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <X size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Scrollable Form Content + Sticky Bottom Bar */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'height' : 'height'}
        keyboardVerticalOffset={0}
      >
        <InsetScrollView
          className="flex-1"
          contentContainerStyle={{
            gap: screenLayout.body.blockGap,
            paddingBottom: screenLayout.body.sectionGap,
          }}
          extraBottomInset={actionBarHeight}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </InsetScrollView>

        {/* Sticky Bottom Bar — frosted glass — inside KAV so it rises above keyboard */}
        <StickyActionBar testID="wizard-bottom-bar">
          <View onLayout={handleActionBarLayout}>
            {/* Fade Out Gradient Mask */}
            <LinearGradient
              colors={['transparent', colors.background]}
              style={{
                position: 'absolute',
                top: -32,
                left: -screenLayout.actions.barPadding,
                right: -screenLayout.actions.barPadding,
                height: 32,
                zIndex: -1,
              }}
              pointerEvents="none"
            />
            {/* BlurView does not reliably accept className in NativeWind v4 — kept imperative */}
            <BlurView
              intensity={40}
              tint="light"
              style={{ borderRadius: radius.lg, overflow: 'hidden' }}
            >
              <View
                style={{
                  paddingTop: screenLayout.actions.barPadding,
                }}
              >
                {showBackButton ? (
                  <View className="flex-row gap-md">
                    <Button
                      label={t('wizard.back')}
                      variant="outline"
                      onPress={onBack}
                      style={{ flex: 1 }}
                      testID={testID ? `${testID}-back` : undefined}
                    />
                    <Button
                      label={nextLabel ?? t('wizard.next')}
                      onPress={onNext}
                      disabled={nextDisabled}
                      isLoading={nextLoading}
                      style={{ flex: 2 }}
                      testID={effectiveNextTestID}
                    />
                  </View>
                ) : (
                  <Button
                    label={nextLabel ?? t('wizard.next')}
                    onPress={onNext}
                    disabled={nextDisabled}
                    isLoading={nextLoading}
                    style={{ alignSelf: 'stretch' }}
                    testID={effectiveNextTestID}
                  />
                )}
              </View>
            </BlurView>
          </View>
        </StickyActionBar>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

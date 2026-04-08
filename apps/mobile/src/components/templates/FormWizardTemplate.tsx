import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
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
  className,
}: FormWizardTemplateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const showBackButton = showBack && onBack && (currentStep > 0 || totalSteps === 1);

  return (
    <ScreenContainer testID={testID} className={className}>
      {/* Step Indicator — bar segments + close button */}
      <View
        className="flex-row items-center pt-header-top pb-item px-screen-x gap-md"
      >
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
          accessibilityLabel={t('wizard.close', 'Close')}
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
            paddingHorizontal: screenLayout.insetX,
            gap: screenLayout.body.blockGap,
            paddingBottom: screenLayout.body.sectionGap,
          }}
          extraBottomInset={96}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </InsetScrollView>

        {/* Sticky Bottom Bar — frosted glass — inside KAV so it rises above keyboard */}
        <StickyActionBar testID="wizard-bottom-bar">
          {/* BlurView does not reliably accept className in NativeWind v4 — kept imperative */}
          <BlurView
            intensity={40}
            tint="light"
            style={{ borderRadius: radius.lg, overflow: 'hidden' }}
          >
            <View
              style={{
                paddingTop: screenLayout.actions.barPadding,
                paddingHorizontal: screenLayout.insetX,
              }}
            >
              {showBackButton ? (
                <View className="flex-row gap-md">
                  <Button
                    label={t('wizard.back', 'Back')}
                    variant="outline"
                    onPress={onBack}
                    style={{ flex: 1 }}
                    testID={testID ? `${testID}-back` : undefined}
                  />
                  <Button
                    label={nextLabel ?? t('wizard.next', 'Next')}
                    onPress={onNext}
                    disabled={nextDisabled}
                    isLoading={nextLoading}
                    style={{ flex: 2 }}
                    testID={testID ? `${testID}-next` : undefined}
                  />
                </View>
              ) : (
                <Button
                  label={nextLabel ?? t('wizard.next', 'Next')}
                  onPress={onNext}
                  disabled={nextDisabled}
                  isLoading={nextLoading}
                  style={{ alignSelf: 'stretch' }}
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

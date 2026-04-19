import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../shells';
import { Button } from '../ui/Button';
import { ScreenHeader } from '../ui/ScreenHeader';

const { colors } = mobileTheme;

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
  /** Hide the sticky action bar entirely (e.g. when the step advances via item tap). */
  hideNext?: boolean;
  /** Optional screen header — rendered above children with consistent typography. */
  title?: string;
  /** Optional eyebrow text above the title (e.g. "STEP 1 OF 7"). */
  greeting?: string;
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
  hideNext = false,
  title,
  greeting,
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
              className={cn('flex-1 rounded-md', i <= currentStep ? 'bg-foreground' : 'bg-border')}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <InsetScrollView
          className="flex-1"
          contentContainerStyle={{
            gap: screenLayout.body.blockGap,
            paddingBottom: screenLayout.body.sectionGap,
          }}
          extraBottomInset={hideNext ? 0 : actionBarHeight}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {title != null && <ScreenHeader greeting={greeting} title={title} />}
          {children}
        </InsetScrollView>

        {/* Sticky Bottom Bar — frosted glass — inside KAV so it rises above keyboard */}
        {!hideNext && (
          <StickyActionBar testID="wizard-bottom-bar">
            <View onLayout={handleActionBarLayout}>
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
            </View>
          </StickyActionBar>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

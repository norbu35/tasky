import React from 'react';
import { View } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors, spacing } = mobileTheme;

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  testID?: string;
  className?: string;
}

export function StepIndicator({ currentStep, totalSteps, testID, className }: StepIndicatorProps) {
  return (
    <View
      className={cn('flex-row items-center justify-center', className)}
      style={{ gap: spacing.sm }}
      testID={testID}
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepIndex = i + 1;
        const isActive = stepIndex === currentStep;
        const isCompleted = stepIndex < currentStep;

        const size = isActive ? 10 : 8;
        const bgColor = isActive
          ? colors.accent
          : isCompleted
            ? colors.primary
            : colors.chipInactive;

        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
            }}
          />
        );
      })}
    </View>
  );
}

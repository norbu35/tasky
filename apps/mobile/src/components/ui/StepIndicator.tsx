import React from 'react';
import { StyleSheet, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing } = mobileTheme;

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    testID?: string;
}

export function StepIndicator({ currentStep, totalSteps, testID }: StepIndicatorProps) {
    return (
        <View
            style={styles.container}
            testID={testID}
            accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
            accessibilityRole="progressbar"
        >
            {Array.from({ length: totalSteps }, (_, i) => {
                const stepIndex = i + 1;
                const isActive = stepIndex === currentStep;
                const isCompleted = stepIndex < currentStep;

                return (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            isActive && styles.activeDot,
                            isCompleted && styles.completedDot,
                            !isActive && !isCompleted && styles.inactiveDot,
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent,
    },
    completedDot: {
        backgroundColor: colors.primary,
    },
    inactiveDot: {
        backgroundColor: colors.chipInactive,
    },
});

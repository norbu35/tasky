import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';
import { InsetScrollView, ScreenContainer } from '../shells';

const { colors, spacing, typography } = mobileTheme;

export interface SuccessCelebrationTemplateProps {
  headline: string;
  body: string;
  nextSteps?: string[];
  ctaLabel: string;
  ctaOnPress: () => void;
  secondaryCtaLabel?: string;
  secondaryCtaOnPress?: () => void;
  testID?: string;
}

function AnimatedCheckmark() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.checkmarkContainer, animatedStyle]}>
      <CheckCircle size={64} color={colors.verified} />
    </Animated.View>
  );
}

export function SuccessCelebrationTemplate({
  headline,
  body,
  nextSteps,
  ctaLabel,
  ctaOnPress,
  secondaryCtaLabel,
  secondaryCtaOnPress,
  testID,
}: SuccessCelebrationTemplateProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID={testID}>
      <InsetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCheckmark />

        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.body}>{body}</Text>

        {nextSteps && nextSteps.length > 0 && (
          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsHeader}>
              {t('success.whatHappensNext', 'What happens next')}
            </Text>
            {nextSteps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <Text style={styles.stepBullet}>{'\u2022'}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <Button
          label={ctaLabel}
          onPress={ctaOnPress}
          style={styles.cta}
          testID={testID ? `${testID}-cta` : undefined}
        />

        {secondaryCtaLabel && secondaryCtaOnPress && (
          <Button
            label={secondaryCtaLabel}
            variant="outline"
            onPress={secondaryCtaOnPress}
            style={styles.secondaryCta}
            testID={testID ? `${testID}-secondary-cta` : undefined}
          />
        )}
      </InsetScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  checkmarkContainer: {
    marginBottom: spacing.xl,
  },
  headline: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.body * 1.6,
  },
  nextStepsSection: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  nextStepsHeader: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  stepBullet: {
    fontSize: typography.body,
    color: colors.accent,
    marginRight: spacing.sm,
    lineHeight: typography.body * 1.6,
  },
  stepText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.accent,
    lineHeight: typography.body * 1.6,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  secondaryCta: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});

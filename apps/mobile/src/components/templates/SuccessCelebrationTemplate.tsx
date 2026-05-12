import { CheckCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { screenLayout } from '@/design/screenLayout';
import { mobileTheme, withEmphasisSpring } from '@/design/tokenAdapter';

import { InsetScrollView, ScreenContainer } from '../shells';
import { Button } from '../ui/Button';

const { colors, iconSizes, spacing } = mobileTheme;

export interface SuccessCelebrationTemplateProps {
  headline: string;
  body: string;
  nextSteps?: string[];
  ctaLabel: string;
  ctaOnPress: () => void;
  secondaryCtaLabel?: string;
  secondaryCtaOnPress?: () => void;
  testID?: string;
  className?: string;
}

function AnimatedCheckmark() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withEmphasisSpring(1);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View className="mb-xl">
        <CheckCircle size={iconSizes.md} color={colors.verified} />
      </View>
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
  className,
}: SuccessCelebrationTemplateProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID={testID} className={className}>
      <InsetScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: spacing['2xl'],
          paddingHorizontal: screenLayout.insetX,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCheckmark />

        <Text className="text-heading font-display-bold text-primary-deep text-center">
          {headline}
        </Text>
        <Text className="text-body font-sans text-foreground text-center mt-md leading-relaxed">
          {body}
        </Text>

        {nextSteps && nextSteps.length > 0 && (
          <View className="self-stretch mt-xl px-sm">
            <Text className="text-subtitle font-sans-semibold text-foreground mb-md">
              {t('success.whatHappensNext')}
            </Text>
            {nextSteps.map((step, index) => (
              <View key={index} className="flex-row mb-sm pl-xs">
                <Text className="text-body font-sans text-text-secondary mr-sm leading-relaxed">
                  {'\u2022'}
                </Text>
                <Text className="flex-1 text-body font-sans text-text-secondary leading-relaxed">
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button
          label={ctaLabel}
          onPress={ctaOnPress}
          style={{ alignSelf: 'stretch', marginTop: spacing.xl }}
          testID={testID ? `${testID}-cta` : undefined}
        />

        {secondaryCtaLabel && secondaryCtaOnPress && (
          <Button
            label={secondaryCtaLabel}
            variant="outline"
            onPress={secondaryCtaOnPress}
            style={{ alignSelf: 'stretch', marginTop: spacing.md }}
            testID={testID ? `${testID}-secondary-cta` : undefined}
          />
        )}
      </InsetScrollView>
    </ScreenContainer>
  );
}

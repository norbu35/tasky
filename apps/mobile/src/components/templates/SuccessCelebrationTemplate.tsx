import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { InsetScrollView, ScreenContainer } from '../shells';

const { colors } = mobileTheme;

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
    <Animated.View className="mb-xl" style={animatedStyle}>
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
  className,
}: SuccessCelebrationTemplateProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID={testID} className={className}>
      <InsetScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCheckmark />

        <Text className="text-heading font-semibold text-primaryDeep text-center">{headline}</Text>
        <Text className="text-body text-primary text-center mt-md leading-relaxed">{body}</Text>

        {nextSteps && nextSteps.length > 0 && (
          <View className="self-stretch mt-xl px-sm">
            <Text className="text-subtitle font-semibold text-primary mb-md">
              {t('success.whatHappensNext')}
            </Text>
            {nextSteps.map((step, index) => (
              <View key={index} className="flex-row mb-sm pl-xs">
                <Text className="text-body text-accent mr-sm leading-relaxed">{'\u2022'}</Text>
                <Text className="flex-1 text-body text-accent leading-relaxed">{step}</Text>
              </View>
            ))}
          </View>
        )}

        <Button
          label={ctaLabel}
          onPress={ctaOnPress}
          style={{ alignSelf: 'stretch', marginTop: 24 }}
          testID={testID ? `${testID}-cta` : undefined}
        />

        {secondaryCtaLabel && secondaryCtaOnPress && (
          <Button
            label={secondaryCtaLabel}
            variant="outline"
            onPress={secondaryCtaOnPress}
            style={{ alignSelf: 'stretch', marginTop: 12 }}
            testID={testID ? `${testID}-secondary-cta` : undefined}
          />
        )}
      </InsetScrollView>
    </ScreenContainer>
  );
}

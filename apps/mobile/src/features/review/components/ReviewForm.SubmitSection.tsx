import { BlurView } from 'expo-blur';
import { ArrowRight, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { elevations } from '@/design/elevations';

import { colors, radius, typography, withAlpha } from './ReviewForm.model';

export function SuccessOverlay({ scale }: { scale: Animated.Value }) {
  const { t } = useTranslation();

  return (
    <Animated.View
      style={{ transform: [{ scale }] }}
      className="items-center justify-center py-3xl gap-md"
      testID="review-success-state"
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center bg-muted"
        style={{ borderRadius: radius.full }}
      >
        <CheckCircle size={24} color={colors.primary} fill={colors.verified} />
      </View>
      <Text className="text-title font-sans-bold text-primary-deep">
        {t('shared.review.successTitle')}
      </Text>
      <Text
        className="max-w-[320px] text-center text-body text-text-secondary"
        style={{ lineHeight: Math.round(typography.body * 1.6) }}
      >
        {t('shared.review.successBody')}
      </Text>
    </Animated.View>
  );
}

export function SubmitFooter({
  allRated,
  errorMessage,
  isPending,
  submitLabel,
  onSubmit,
  onLayout,
}: {
  allRated: boolean;
  errorMessage: string | null;
  isPending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onLayout: (event: import('react-native').LayoutChangeEvent) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {errorMessage ? (
        <View
          testID="review-submit-error"
          className="mb-sm rounded-md bg-card p-lg gap-sm"
          style={elevations.card}
        >
          <Text
            className="text-body text-danger"
            style={{ lineHeight: Math.round(typography.body * 1.5) }}
          >
            {errorMessage}
          </Text>
          <Button
            label={t('common.retry')}
            variant="ghost"
            onPress={onSubmit}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
            testID="review-submit-retry"
          />
        </View>
      ) : null}

      <View onLayout={onLayout}>
        <BlurView
          intensity={80}
          tint="light"
          style={{
            borderRadius: radius.lg,
            overflow: 'hidden',
            backgroundColor: withAlpha(colors.card, 0.8),
            ...elevations.navBar,
          }}
        >
          <View className="pt-action-bar">
            <Button
              testID="review-form-next"
              onPress={onSubmit}
              disabled={!allRated}
              isLoading={isPending}
              style={{ alignSelf: 'stretch', justifyContent: 'center' }}
            >
              <View className="flex-row items-center justify-center gap-sm">
                <Text className="text-body font-sans-bold text-primary-foreground">
                  {submitLabel}
                </Text>
                <ArrowRight size={16} color={colors.primaryForeground} />
              </View>
            </Button>
          </View>
        </BlurView>
      </View>
    </>
  );
}

import { CircleAlert, Scale } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

import { DISPUTE_STATUS_SURFACE } from './model';

const { colors } = mobileTheme;

export function DecorativeScale() {
  return (
    <View
      className="rounded-lg overflow-hidden items-center justify-center opacity-disabled"
      style={{
        height: DISPUTE_STATUS_SURFACE.timeline.decorativeScaleHeight,
      }}
    >
      <Scale size={24} color={colors.textSecondary} />
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="items-center justify-center py-3xl">
      <ActivityIndicator size="small" color={colors.primaryDeep} />
    </View>
  );
}

export function ErrorState({
  errorMessage,
  retryLabel,
  onRetry,
}: {
  errorMessage: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <View className="bg-card rounded-lg p-lg items-center gap-sm">
      <CircleAlert size={24} color={colors.danger} />
      <Text className="text-body text-primary-deep text-center leading-relaxed">
        {errorMessage}
      </Text>
      <Touchable onPress={onRetry} className="px-lg py-sm rounded-md border border-primary-deep">
        <Text className="text-body text-primary-deep font-sans-bold">{retryLabel}</Text>
      </Touchable>
    </View>
  );
}

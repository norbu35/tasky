import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';

const { taskDetail } = mobileSurfaces;

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-md">
      <Text
        className="flex-1 text-label font-bold text-text-secondary uppercase"
        style={{ letterSpacing: taskDetail.labelTracking }}
      >
        {label}
      </Text>
      <Text className="flex-1 text-label font-bold text-foreground text-right">{value}</Text>
    </View>
  );
}

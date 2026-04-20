import React from 'react';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';

export function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      className="pb-xs items-start"
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-label font-semibold${active ? ' text-primary-deep' : ' text-text-secondary'}`}
      >
        {label}
      </Text>
      {active ? <View className="mt-xs w-12 h-1 rounded-full bg-primary-deep" /> : null}
    </Touchable>
  );
}

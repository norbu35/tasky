import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;
const { tint } = mobileSurfaces;

interface LocationCardProps {
  locationText?: string;
  t: (k: string) => string;
}

export function LocationCard({ locationText, t }: LocationCardProps) {
  return (
    <View className="rounded-lg p-lg gap-sm" style={{ backgroundColor: tint.primarySubtle }}>
      <View className="flex-row items-center gap-sm">
        <MapPin size={16} color={colors.primaryDeep} />
        <Text className="flex-1 text-body font-bold text-primary-deep">{locationText ?? ''}</Text>
      </View>
      <Text className="text-caption text-text-secondary leading-relaxed">
        {t('TaskDetailCustomerScreen.locationNote')}
      </Text>
    </View>
  );
}

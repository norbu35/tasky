import { Navigation } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

export function MapOverlay() {
  const { t } = useTranslation();
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center gap-xs">
      <View className="px-lg py-sm rounded-md bg-primary-deep">
        <Text className="text-label font-bold text-primary-foreground">
          {t('LocationScreen.pickHere')}
        </Text>
      </View>
      <View className="w-8 h-8 rounded-full items-center justify-center bg-primary">
        <Navigation size={16} color={colors.primaryForeground} />
      </View>
    </View>
  );
}

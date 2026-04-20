import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';

const { tint } = mobileSurfaces;

interface CompletedBannerProps {
  t: (k: string) => string;
}

export function CompletedBanner({ t }: CompletedBannerProps) {
  return (
    <View className="p-lg rounded-lg gap-xs" style={{ backgroundColor: tint.borderSoft }}>
      <Text className="text-body font-extrabold text-primary-deep">
        {t('TaskDetailCustomerScreen.completedTitle')}
      </Text>
      <Text className="text-caption text-text-secondary">
        {t('TaskDetailCustomerScreen.completedBody')}
      </Text>
    </View>
  );
}

interface CancelledBannerProps {
  t: (k: string) => string;
}

export function CancelledBanner({ t }: CancelledBannerProps) {
  return (
    <View className="p-lg rounded-lg gap-xs" style={{ backgroundColor: tint.borderSoft }}>
      <Text className="text-body font-extrabold text-primary-deep">
        {t('TaskDetailCustomerScreen.cancelledTitle')}
      </Text>
      <Text className="text-caption text-text-secondary">
        {t('TaskDetailCustomerScreen.cancelledBody')}
      </Text>
    </View>
  );
}

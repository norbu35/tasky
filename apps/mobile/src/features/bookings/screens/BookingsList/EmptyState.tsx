import { ClipboardList } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;
const { bookingList } = mobileSurfaces;

export function EmptyState({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center gap-md py-2xl px-xl">
      <View className="w-16 h-16 rounded-lg items-center justify-center bg-muted">
        <ClipboardList size={24} color={colors.secondary} />
      </View>
      <Text className="text-title font-bold text-primary-deep text-center">
        {t('customer.bookings.emptyTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center leading-relaxed">
        {t('customer.bookings.emptyDescription')}
      </Text>
      <Touchable
        onPress={onPress}
        className="px-xl rounded-md bg-secondary items-center justify-center"
        style={{ minHeight: bookingList.ctaHeight }}
        testID="bookings-empty-cta"
      >
        <Text className="text-label font-bold text-secondary-foreground">
          {t('customer.bookings.emptyCta')}
        </Text>
      </Touchable>
    </View>
  );
}

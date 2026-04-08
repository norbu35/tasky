import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Receipt } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function BusinessBillingScreen() {
  const { t } = useTranslation();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();

  // TODO: wire real data — fetch subscription and billing info

  return (
    <DetailTemplate testID="SCR-B2B-007">
      <View className="items-center py-xl gap-lg">
        <Receipt size={48} color={colors.primary} />
        <Text className="text-heading font-semibold text-primaryDeep text-center">
          {t('b2b.billing.headline', 'Business Subscription')}
        </Text>
        <Text className="text-body text-mutedForeground text-center leading-6">
          {t('b2b.billing.body', 'Manage your subscription plan and billing history.')}
        </Text>
      </View>
    </DetailTemplate>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function TaskBoostPayScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — load boost summary, QPay integration

  return (
    <DetailTemplate testID="SCR-CUST-029">
      <View className="items-center py-xl gap-lg">
        <CreditCard size={48} color={colors.primary} />
        <Text className="text-heading font-semibold text-primaryDeep text-center">
          {t('customer.boostPay.headline', 'Complete Payment')}
        </Text>
        <Text className="text-body text-mutedForeground text-center leading-6">
          {t('customer.boostPay.body', 'Pay securely via QPay to activate your boost.')}
        </Text>
        <Button
          label={t('customer.boostPay.payNow', 'Pay with QPay')}
          onPress={() => {
            // TODO: wire QPay integration
            router.back();
          }}
          className="self-stretch"
        />
        <Button
          label={t('common.goBack', 'Go Back')}
          variant="ghost"
          onPress={() => router.back()}
          className="self-stretch"
        />
      </View>
    </DetailTemplate>
  );
}

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

const BOOST_OPTIONS = [
  { id: 'promoted', labelKey: 'customer.boost.promoted', fallback: 'Promoted Listing', price: 5000 },
  { id: 'urgent', labelKey: 'customer.boost.urgent', fallback: 'Urgent (2x visibility)', price: 10000 },
];

export default function TaskBoostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  // TODO: wire real data — fetch boost pricing, apply boost on confirm

  return (
    <DetailTemplate testID="SCR-CUST-028">
      <View className="items-center py-xl gap-lg">
        <Zap size={48} color={colors.secondary} />
        <Text className="text-heading font-semibold text-primaryDeep text-center">
          {t('customer.boost.headline', 'Boost Your Task')}
        </Text>
        <Text className="text-body text-mutedForeground text-center leading-6">
          {t('customer.boost.body', 'Increase visibility to attract more applicants faster.')}
        </Text>
        {BOOST_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            label={t(opt.labelKey, opt.fallback)}
            variant={selected === opt.id ? 'default' : 'outline'}
            onPress={() => setSelected(opt.id)}
            className="self-stretch"
          />
        ))}
        <Button
          label={t('customer.boost.continue', 'Continue to Payment')}
          onPress={() => router.push('/(customer)/tasks/[taskId]/boost-pay')}
          disabled={!selected}
          className="self-stretch"
        />
      </View>
    </DetailTemplate>
  );
}

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function TaskBoostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const boostOptions = [
    {
      id: 'promoted',
      labelKey: 'customer.boost.promoted',
      fallback: t('TaskBoostScreen.copy1'),
      price: 5000,
    },
    {
      id: 'urgent',
      labelKey: 'customer.boost.urgent',
      fallback: t('TaskBoostScreen.copy2'),
      price: 10000,
    },
  ];

  // TODO: wire real data — fetch boost pricing, apply boost on confirm

  return (
    <DetailTemplate testID="SCR-CUST-028">
      <View className="items-center py-xl gap-lg">
        <Zap size={48} color={colors.secondary} />
        <Text className="text-heading font-semibold text-primaryDeep text-center">
          {t('customer.boost.headline')}
        </Text>
        <Text className="text-body text-mutedForeground text-center leading-6">
          {t('customer.boost.body')}
        </Text>
        {boostOptions.map((opt) => (
          <Button
            key={opt.id}
            label={t(opt.labelKey, opt.fallback)}
            variant={selected === opt.id ? 'default' : 'outline'}
            onPress={() => setSelected(opt.id)}
            className="self-stretch"
          />
        ))}
        <Button
          label={t('customer.boost.continue')}
          onPress={() => router.push('/(customer)/tasks/[taskId]/boost-pay')}
          disabled={!selected}
          className="self-stretch"
        />
      </View>
    </DetailTemplate>
  );
}

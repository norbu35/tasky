import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

type PayoutState = 'default' | 'submitted';

export default function WalletPayoutScreen() {
  const params = useLocalSearchParams<{ state?: PayoutState }>();
  const { t } = useTranslation();
  const [amount, setAmount] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const state = params.state === 'submitted' ? 'submitted' : 'default';

  if (state === 'submitted') {
    return (
      <View testID="SCR-P3-002" className="flex-1 items-center justify-center bg-background">
        <Text className="text-heading font-display-bold text-primary-deep">
          {t('tasker.wallet.payoutSuccess')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, gap: 16 }}
      testID="wallet-payout-screen"
    >
      <Text className="text-heading font-display-bold text-primary-deep">
        {t('tasker.wallet.payoutTitle')}
      </Text>
      <Text className="text-body text-text-secondary">{t('tasker.wallet.payoutBalance')}</Text>
      <Input value={amount} onChangeText={setAmount} placeholder="₮0" />
      {showError ? (
        <Text className="text-danger text-label">{t('tasker.wallet.payoutMinError')}</Text>
      ) : null}
      <Button
        testID="wallet-payout-submit"
        label={t('tasker.wallet.payoutSubmit')}
        onPress={() => setShowError(Number(amount || 0) < 10000)}
      />
    </ScrollView>
  );
}

import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type PayoutState = 'default' | 'submitted';

export default function WalletPayoutScreen() {
  const params = useLocalSearchParams<{ state?: PayoutState }>();
  const [amount, setAmount] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const state = params.state === 'submitted' ? 'submitted' : 'default';

  if (state === 'submitted') {
    return (
      <View style={styles.successContainer} testID="wallet-payout-screen">
        <Text style={styles.title}>Хүсэлт амжилттай илгээгдлээ</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="wallet-payout-screen"
    >
      <Text style={styles.title}>Мөнгө татах</Text>
      <Text style={styles.balance}>Боломжит үлдэгдэл: ₮120,000</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="₮0"
        placeholderTextColor="#8c8f93"
        style={styles.input}
      />
      {showError ? <Text style={styles.error}>Хамгийн бага дүн: ₮10,000</Text> : null}
      <Button
        testID="wallet-payout-submit"
        label="Хүсэлт илгээх"
        onPress={() => setShowError(Number(amount || 0) < 10000)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.primaryDeep },
  balance: { fontSize: typography.body, color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: '#d7d2c8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.primaryDeep,
  },
  error: { color: colors.danger, fontSize: typography.label },
});

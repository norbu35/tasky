import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function TaskBoostPayScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — load boost summary, QPay integration

  return (
    <DetailTemplate testID="SCR-CUST-029">
      <View style={styles.content}>
        <CreditCard size={48} color={colors.primary} />
        <Text style={styles.headline}>
          {t('customer.boostPay.headline', 'Complete Payment')}
        </Text>
        <Text style={styles.body}>
          {t('customer.boostPay.body', 'Pay securely via QPay to activate your boost.')}
        </Text>
        <Button
          label={t('customer.boostPay.payNow', 'Pay with QPay')}
          onPress={() => {
            // TODO: wire QPay integration
            router.back();
          }}
          style={styles.button}
        />
        <Button
          label={t('common.goBack', 'Go Back')}
          variant="ghost"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.lg },
  headline: { fontSize: typography.heading, fontWeight: '600', color: colors.primaryDeep, textAlign: 'center' },
  body: { fontSize: typography.body, color: colors.mutedForeground, textAlign: 'center', lineHeight: typography.body * 1.6 },
  button: { alignSelf: 'stretch' },
});

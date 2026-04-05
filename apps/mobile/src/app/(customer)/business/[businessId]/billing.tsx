import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Receipt } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function BusinessBillingScreen() {
  const { t } = useTranslation();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();

  // TODO: wire real data — fetch subscription and billing info

  return (
    <DetailTemplate testID="SCR-B2B-007">
      <View style={styles.content}>
        <Receipt size={48} color={colors.primary} />
        <Text style={styles.headline}>
          {t('b2b.billing.headline', 'Business Subscription')}
        </Text>
        <Text style={styles.body}>
          {t('b2b.billing.body', 'Manage your subscription plan and billing history.')}
        </Text>
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.lg },
  headline: { fontSize: typography.heading, fontWeight: '600', color: colors.primaryDeep, textAlign: 'center' },
  body: { fontSize: typography.body, color: colors.mutedForeground, textAlign: 'center', lineHeight: typography.body * 1.6 },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

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
      <View style={styles.content}>
        <Zap size={48} color={colors.secondary} />
        <Text style={styles.headline}>
          {t('customer.boost.headline', 'Boost Your Task')}
        </Text>
        <Text style={styles.body}>
          {t('customer.boost.body', 'Increase visibility to attract more applicants faster.')}
        </Text>
        {BOOST_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            label={t(opt.labelKey, opt.fallback)}
            variant={selected === opt.id ? 'default' : 'outline'}
            onPress={() => setSelected(opt.id)}
            style={styles.button}
          />
        ))}
        <Button
          label={t('customer.boost.continue', 'Continue to Payment')}
          onPress={() => router.push('/(customer)/tasks/[taskId]/boost-pay')}
          disabled={!selected}
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

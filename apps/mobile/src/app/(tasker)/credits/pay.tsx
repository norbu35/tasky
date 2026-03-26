import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { InfoRow } from '../../../components/ui/InfoRow';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

type RouteState = 'loaded' | 'error';

const amountOptions = ['10,000 ₮', '20,000 ₮', '50,000 ₮'];

function resolveState(value: string | string[] | undefined): RouteState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'error' ? 'error' : 'loaded';
}

export default function TaskerCreditsPayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const state = resolveState(params.state);

  if (state === 'error') {
    return (
      <DetailTemplate
        headerTitle="Top up credits"
        onBack={() => router.back()}
        isError
        onRetry={() => router.replace('/(tasker)/credits/pay')}
        errorMessage="Could not load top-up options"
        testID="tasker-credits-pay"
      >
        <View />
      </DetailTemplate>
    );
  }

  return (
    <DetailTemplate
      headerTitle="Top up credits"
      onBack={() => router.back()}
      ctaLabel="Confirm top up"
      ctaOnPress={() => router.replace('/(tasker)/credits/history')}
      testID="tasker-credits-pay"
    >
      <View style={styles.stack}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an amount</Text>
          <View style={styles.amountGrid}>
            {amountOptions.map((amount) => (
              <Pressable
                key={amount}
                style={[styles.amountCard, amount === '20,000 ₮' && styles.amountCardSelected]}
                testID={`tasker-credits-amount-${amount.replace(/[^0-9]/g, '')}`}
              >
                <Text style={[styles.amountText, amount === '20,000 ₮' && styles.amountTextSelected]}>
                  {amount}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top-up preview</Text>
          <View style={styles.previewCard}>
            <InfoRow label="Method" value="Mobile wallet" />
            <InfoRow label="Processing" value="Instant" />
            <InfoRow label="Balance after top up" value="32,400 ₮" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.note}>
            This shell uses demo data only. Payment rails are not wired in this lane.
          </Text>
        </View>
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  amountGrid: {
    gap: spacing.sm,
  },
  amountCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  amountCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 38, 56, 0.08)',
  },
  amountText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  amountTextSelected: {
    color: colors.primary,
  },
  previewCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  note: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
});

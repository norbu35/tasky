import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const state = resolveState(params.state);

  if (state === 'error') {
    return (
      <DetailTemplate testID="SCR-P2-002"
        isError
        onRetry={() => router.replace('/(tasker)/credits/pay')}
        errorMessage="Could not load top-up options"
      >
        <View />
      </DetailTemplate>
    );
  }

  return (
    <DetailTemplate
      ctaLabel="Confirm top up"
      ctaOnPress={() => router.replace('/(tasker)/credits/history')}
      testID="SCR-P2-002"
    >
      <View style={styles.stack}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('tasker.credits.chooseAmount', 'Choose an amount')}
          </Text>
          <View style={styles.amountGrid}>
            {amountOptions.map((amount) => (
              <Pressable
                key={amount}
                style={[styles.amountCard, amount === '20,000 ₮' && styles.amountCardSelected]}
                testID={`tasker-credits-amount-${amount.replace(/[^0-9]/g, '')}`}
              >
                <Text
                  style={[styles.amountText, amount === '20,000 ₮' && styles.amountTextSelected]}
                >
                  {amount}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('tasker.credits.topUpPreview', 'Top-up preview')}
          </Text>
          <View style={styles.previewCard}>
            <InfoRow
              label={t('tasker.credits.method', 'Method')}
              value={t('tasker.credits.mobileWallet', 'Mobile wallet')}
            />
            <InfoRow
              label={t('tasker.credits.processing', 'Processing')}
              value={t('tasker.credits.instant', 'Instant')}
            />
            <InfoRow
              label={t('tasker.credits.balanceAfterTopUp', 'Balance after top up')}
              value="32,400 ₮"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tasker.credits.notes', 'Notes')}</Text>
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
    backgroundColor: colors.muted,
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
    backgroundColor: colors.muted,
  },
  note: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
});

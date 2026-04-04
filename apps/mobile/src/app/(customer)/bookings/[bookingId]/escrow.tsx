import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { elevations } from '../../../../design/elevations';
import { useTranslation } from 'react-i18next';

const { colors, spacing, typography, radius } = mobileTheme;

type EscrowState = 'shell' | 'confirm' | 'success' | 'error';

export default function EscrowScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ state?: string; demoState?: string }>();
  const [state, setState] = React.useState<EscrowState>(() => {
    if (params.demoState === 'error') return 'error';
    if (params.state === 'escrowed') return 'success';
    return 'shell';
  });

  React.useEffect(() => {
    if (params.demoState === 'error') {
      setState('error');
      return;
    }

    if (params.state === 'escrowed') {
      setState('success');
      return;
    }

    setState('shell');
  }, [params.demoState, params.state]);

  if (state === 'error') {
    return (
      <ScrollView testID="SCR-P3-003"
        style={styles.container}
        contentContainerStyle={styles.content}
       
      >
        <View style={styles.errorCard} testID="booking-escrow-screen-error">
          <Text style={styles.cardTitle}>{t('customer.bookings.escrowFlow.paymentFailed', 'Payment failed')}</Text>
          <Text style={styles.description}>
            {t('customer.bookings.escrowFlow.errorDescription', 'Escrow payment cannot proceed currently.')}
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (state === 'success') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="booking-escrow-screen"
      >
        <View style={styles.successCard}>
          <Text style={styles.cardTitle}>{t('customer.bookings.escrowFlow.paymentConfirmed', 'Payment confirmed')}</Text>
          <Text style={styles.successTitle}>{t('customer.bookings.escrowFlow.escrowSuccess', 'Escrow successful!')}</Text>
          <Text style={styles.description}>{t('customer.bookings.escrowFlow.escrowHeldDescription', 'Payment is securely held in escrow.')}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="booking-escrow-screen"
    >
      <View testID="escrow-screen">
        <Text style={styles.title}>{t('customer.bookings.escrowFlow.title', 'Escrow Payment')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('customer.bookings.escrowFlow.optInTitle', 'Add protection with escrow payment')}</Text>
          <Text style={styles.description}>
            {t('customer.bookings.escrowFlow.optInDescription', 'Payment will be securely deposited. Tasker receives money only after completion.')}
          </Text>
        </View>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>{t('customer.bookings.escrowFlow.featureProtection', 'Money protection')}</Text>
          <Text style={styles.featureItem}>{t('customer.bookings.escrowFlow.featureDispute', 'Dispute resolution')}</Text>
          <Text style={styles.featureItem}>{t('customer.bookings.escrowFlow.featureAutoTransfer', 'Automatic transfer')}</Text>
        </View>

        <Button
          label={t('customer.bookings.escrowFlow.useEscrow', 'Use Escrow')}
          onPress={() => setState('confirm')}
          testID="booking-escrow-screen-cta"
        />

        {state === 'confirm' && (
          <View style={styles.sheet} testID="booking-escrow-confirm-sheet">
            <Text style={styles.sheetTitle}>{t('customer.bookings.escrowFlow.confirmTitle', 'Confirm')}</Text>
            <Text style={styles.sheetDescription}>
              {t('customer.bookings.escrowFlow.sheetDescription', 'By confirming to use Escrow, your payment will be securely held.')}
            </Text>
            <Button
              label={t('customer.bookings.escrowFlow.continueBtn', 'Continue')}
              onPress={() => setState('success')}
              testID="booking-escrow-confirm"
            />
            <Pressable onPress={() => setState('shell')}>
              <Text style={styles.cancelText}>{t('customer.bookings.escrowFlow.cancelText', 'Go back')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.primaryDeep },
  card: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...elevations.soft,
  },
  errorCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  successCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
  successTitle: { fontSize: typography.body, fontWeight: '700', color: colors.primaryDeep },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  featureList: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featureItem: { fontSize: typography.body, color: colors.primaryDeep, fontWeight: '500' },
  sheet: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: { fontSize: typography.title, fontWeight: '700', color: colors.primaryDeep },
  sheetDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  cancelText: { fontSize: typography.body, color: colors.textSecondary, textAlign: 'center' },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type LeadUnlockState = 'notification_received' | 'insufficient_credits';

interface LeadUnlockSheetProps {
  isOpen: boolean;
  state?: LeadUnlockState;
  customerName: string;
  taskTitle: string;
  creditCost: number;
  balance: number;
  onAccept: () => void;
  onDecline: () => void;
  onBuyCredits: () => void;
  onClose: () => void;
}

export function LeadUnlockSheet({
  isOpen,
  state = 'notification_received',
  customerName,
  taskTitle,
  creditCost,
  balance,
  onAccept,
  onDecline,
  onBuyCredits,
}: LeadUnlockSheetProps) {
  if (!isOpen) return null;

  const insufficient = state === 'insufficient_credits';

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet} testID="lead-unlock-sheet">
        <View style={styles.handle} />
        <Text style={styles.title}>Захиалагч таныг сонголоо!</Text>
        <Text style={styles.subtitle}>{customerName}</Text>
        <View style={styles.card}>
          <Text style={styles.taskTitle}>{taskTitle}</Text>
          <Text style={styles.meta}>{creditCost} кредит</Text>
          <Text style={styles.meta}>Үлдэгдэл: {balance}</Text>
        </View>
        {insufficient ? (
          <>
            <Text style={styles.warning}>Кредит хүрэлцэхгүй байна</Text>
            <Button
              testID="lead-unlock-buy-credits"
              label="Кредит худалдаж авах"
              onPress={onBuyCredits}
              style={styles.primaryButton}
            />
            <Button label="Татгалзах" variant="ghost" onPress={onDecline} />
          </>
        ) : (
          <>
            <Button
              label="Зөвшөөрч, кредит зарцуулах"
              onPress={onAccept}
              style={styles.primaryButton}
            />
            <Button label="Татгалзах" variant="ghost" onPress={onDecline} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(0, 36, 68, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d8d6d0',
    alignSelf: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: '#f4f3f0',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  taskTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  meta: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
  warning: {
    fontSize: typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 52,
  },
});

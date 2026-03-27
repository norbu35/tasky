import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { mobileTheme } from '../../../design/tokenAdapter';
import { Button } from '../../../components/ui/Button';

const { colors, spacing, typography, radius } = mobileTheme;

interface LowBalanceAlertProps {
  balanceText: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryActionPress: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  primaryActionTestID?: string;
  secondaryActionTestID?: string;
  testID?: string;
}

export function LowBalanceAlert({
  balanceText,
  description,
  primaryActionLabel,
  onPrimaryActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
  primaryActionTestID,
  secondaryActionTestID,
  testID,
}: LowBalanceAlertProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID} accessibilityRole="alert">
      <View style={styles.iconShell}>
        <AlertTriangle size={20} color={colors.danger} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('tasker.credits.balanceLow', 'Balance running low')}</Text>
        <Text style={styles.balance}>{balanceText}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actions}>
          <Button
            label={primaryActionLabel}
            onPress={onPrimaryActionPress}
            testID={primaryActionTestID}
            style={styles.primaryButton}
          />
          {secondaryActionLabel && onSecondaryActionPress ? (
            <Pressable
              onPress={onSecondaryActionPress}
              testID={secondaryActionTestID}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>{secondaryActionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 221, 184, 0.28)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  iconShell: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 44, 27, 0.1)',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  balance: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.danger,
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.4,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    alignSelf: 'stretch',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  secondaryText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.primary,
  },
});

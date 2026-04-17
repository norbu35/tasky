import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { overlays } from '../../../design/elevations';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type LeadUnlockState =
  | 'notification_received'
  | 'grandfathered_discount_applied'
  | 'accepting'
  | 'accepted_credits_deducted'
  | 'declined'
  | 'insufficient_credits'
  | 'expired_15min';

interface LeadUnlockSheetProps {
  isOpen: boolean;
  state?: LeadUnlockState;
  customerName: string;
  taskTitle: string;
  creditCost: number;
  balance: number;
  minutesRemaining?: number;
  secondsRemaining?: number;
  onAccept: () => void;
  onDecline: () => void;
  onBuyCredits: () => void;
  onClose: () => void;
}

function formatTimer(minutes: number, seconds: number): string {
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function LeadUnlockSheet({
  isOpen,
  state = 'notification_received',
  customerName,
  taskTitle,
  creditCost,
  balance,
  minutesRemaining = 15,
  secondsRemaining = 0,
  onAccept,
  onDecline,
  onBuyCredits,
  onClose,
}: LeadUnlockSheetProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const isInsufficient = state === 'insufficient_credits';
  const isAccepted = state === 'accepted_credits_deducted';
  const isDeclined = state === 'declined';
  const isExpired = state === 'expired_15min';
  const isAccepting = state === 'accepting';
  const isDiscounted = state === 'grandfathered_discount_applied';

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet} testID="lead-unlock-sheet">
        <View style={styles.handle} />

        {isAccepting ? (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{t('LeadUnlockSheet.copy1')}</Text>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.subtitle}>{t('LeadUnlockSheet.copy2')}</Text>
          </View>
        ) : isAccepted ? (
          <View style={styles.stateStack}>
            <CheckCircle size={64} color={colors.verified} />
            <Text style={styles.title}>{t('LeadUnlockSheet.copy3')}</Text>
            <Text style={styles.subtitle}>
              {`Захиалагчийн холбоо барих мэдээлэл нээгдлээ. ${creditCost} кредит зарцуулагдлаа.`}
            </Text>
            <View style={styles.inlineCard}>
              <Text style={styles.cardTitle}>{t('LeadUnlockSheet.copy4')}</Text>
              <Text style={styles.meta}>{customerName}</Text>
              <Text style={styles.meta}>{taskTitle}</Text>
            </View>
            <Button label={t('LeadUnlockSheet.copy5')} onPress={onClose} />
          </View>
        ) : isDeclined ? (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{t('LeadUnlockSheet.copy6')}</Text>
            <Text style={styles.subtitle}>{t('LeadUnlockSheet.copy7')}</Text>
            <Button label={t('LeadUnlockSheet.copy8')} onPress={onClose} />
          </View>
        ) : isExpired ? (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{t('LeadUnlockSheet.copy9')}</Text>
            <Text style={styles.subtitle}>{t('LeadUnlockSheet.copy10')}</Text>
            <Button label={t('LeadUnlockSheet.copy11')} onPress={onClose} />
          </View>
        ) : (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{t('LeadUnlockSheet.copy12')}</Text>
            <Text style={styles.subtitle}>{customerName}</Text>

            <View style={styles.inlineCard}>
              <Text style={styles.cardTitle}>{taskTitle}</Text>
              <Text style={styles.meta}>{`${creditCost} кредит`}</Text>
              <Text style={styles.meta}>{`Үлдэгдэл: ${balance} кредит`}</Text>
              <Text
                style={styles.meta}
              >{`Хүлээх хугацаа: ${formatTimer(minutesRemaining, secondsRemaining)}`}</Text>
              <Text style={styles.meta}>
                {`Холбоо барих мэдээлэл ${isDiscounted ? t('LeadUnlockSheet.copy13') : ''}`.trim()}
              </Text>
            </View>

            <Text style={styles.refundNotice}>{t('LeadUnlockSheet.copy14')}</Text>

            {isInsufficient ? (
              <>
                <Text style={styles.warning}>{t('LeadUnlockSheet.copy15')}</Text>
                <Button
                  testID="lead-unlock-buy-credits"
                  label={t('LeadUnlockSheet.copy16')}
                  onPress={onBuyCredits}
                  style={styles.primaryButton}
                />
                <Button label={t('LeadUnlockSheet.copy17')} variant="ghost" onPress={onDecline} />
              </>
            ) : (
              <>
                <Button
                  label={t('LeadUnlockSheet.copy18')}
                  onPress={onAccept}
                  style={styles.primaryButton}
                />
                <Button label={t('LeadUnlockSheet.copy19')} variant="ghost" onPress={onDecline} />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: overlays.sheet,
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
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  stateStack: {
    gap: spacing.md,
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
    lineHeight: typography.label * 1.5,
  },
  inlineCard: {
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  meta: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
  refundNotice: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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

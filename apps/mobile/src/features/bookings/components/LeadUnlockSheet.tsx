import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
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
            <Text style={styles.title}>{'Захиалагч таныг сонголоо!'}</Text>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.subtitle}>{'Кредит зарцуулж байна...'}</Text>
          </View>
        ) : isAccepted ? (
          <View style={styles.stateStack}>
            <CheckCircle size={64} color={colors.verified} />
            <Text style={styles.title}>{'Амжилттай!'}</Text>
            <Text style={styles.subtitle}>
              {`Захиалагчийн холбоо барих мэдээлэл нээгдлээ. ${creditCost} кредит зарцуулагдлаа.`}
            </Text>
            <View style={styles.inlineCard}>
              <Text style={styles.cardTitle}>{'Холбоо барих'}</Text>
              <Text style={styles.meta}>{customerName}</Text>
              <Text style={styles.meta}>{taskTitle}</Text>
            </View>
            <Button label={'Ойлголоо'} onPress={onClose} />
          </View>
        ) : isDeclined ? (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{'Татгалзсан'}</Text>
            <Text style={styles.subtitle}>{'Кредит зарцуулагдаагүй. Дараагийн боломжийг хүлээнэ үү.'}</Text>
            <Button label={'Ойлголоо'} onPress={onClose} />
          </View>
        ) : isExpired ? (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{'Хугацаа дууслаа'}</Text>
            <Text style={styles.subtitle}>
              {'15 минутын хугацаа дууссан тул автоматаар татгалзсан. Кредит зарцуулагдаагүй.'}
            </Text>
            <Button label={'Ойлголоо'} onPress={onClose} />
          </View>
        ) : (
          <View style={styles.stateStack}>
            <Text style={styles.title}>{'Захиалагч таныг сонголоо!'}</Text>
            <Text style={styles.subtitle}>{customerName}</Text>

            <View style={styles.inlineCard}>
              <Text style={styles.cardTitle}>{taskTitle}</Text>
              <Text style={styles.meta}>{`${creditCost} кредит`}</Text>
              <Text style={styles.meta}>{`Үлдэгдэл: ${balance} кредит`}</Text>
              <Text style={styles.meta}>{`Хүлээх хугацаа: ${formatTimer(minutesRemaining, secondsRemaining)}`}</Text>
              <Text style={styles.meta}>{`Холбоо барих мэдээлэл ${isDiscounted ? '5% хөнгөлөлттэй' : ''}`.trim()}</Text>
            </View>

            <Text style={styles.refundNotice}>{'Захиалагч цуцалвал кредит буцаагдана'}</Text>

            {isInsufficient ? (
              <>
                <Text style={styles.warning}>{'Кредит хүрэлцэхгүй байна'}</Text>
                <Button
                  testID="lead-unlock-buy-credits"
                  label={'Кредит худалдаж авах'}
                  onPress={onBuyCredits}
                  style={styles.primaryButton}
                />
                <Button label={'Татгалзах'} variant="ghost" onPress={onDecline} />
              </>
            ) : (
              <>
                <Button
                  label={'Зөвшөөрч, кредит зарцуулах'}
                  onPress={onAccept}
                  style={styles.primaryButton}
                />
                <Button label={'Татгалзах'} variant="ghost" onPress={onDecline} />
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
    backgroundColor: '#f4f3f0',
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

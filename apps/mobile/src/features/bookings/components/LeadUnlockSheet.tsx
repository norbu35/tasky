import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { overlays } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors, typography } = mobileTheme;

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
    <View className="justify-end" style={{ backgroundColor: overlays.sheet }}>
      <View className="bg-card rounded-tl-lg rounded-tr-lg p-xl gap-md" testID="lead-unlock-sheet">
        <View className="w-12 h-[5] rounded-full bg-border self-center" />

        {isAccepting ? (
          <View className="gap-md">
            <Text className="text-title font-bold text-primary-deep text-center">
              {t('LeadUnlockSheet.copy1')}
            </Text>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text
              className="text-label text-text-secondary text-center"
              style={{ lineHeight: typography.label * 1.5 }}
            >
              {t('LeadUnlockSheet.copy2')}
            </Text>
          </View>
        ) : isAccepted ? (
          <View className="gap-md">
            <CheckCircle size={24} color={colors.verified} />
            <Text className="text-title font-bold text-primary-deep text-center">
              {t('LeadUnlockSheet.copy3')}
            </Text>
            <Text
              className="text-label text-text-secondary text-center"
              style={{ lineHeight: typography.label * 1.5 }}
            >
              {`Захиалагчийн холбоо барих мэдээлэл нээгдлээ. ${creditCost} кредит зарцуулагдлаа.`}
            </Text>
            <View className="rounded-md bg-muted p-lg gap-sm">
              <Text className="text-body font-bold text-primary-deep">
                {t('LeadUnlockSheet.copy4')}
              </Text>
              <Text className="text-label text-text-secondary">{customerName}</Text>
              <Text className="text-label text-text-secondary">{taskTitle}</Text>
            </View>
            <Button label={t('LeadUnlockSheet.copy5')} onPress={onClose} />
          </View>
        ) : isDeclined ? (
          <View className="gap-md">
            <Text className="text-title font-bold text-primary-deep text-center">
              {t('LeadUnlockSheet.copy6')}
            </Text>
            <Text
              className="text-label text-text-secondary text-center"
              style={{ lineHeight: typography.label * 1.5 }}
            >
              {t('LeadUnlockSheet.copy7')}
            </Text>
            <Button label={t('LeadUnlockSheet.copy8')} onPress={onClose} />
          </View>
        ) : isExpired ? (
          <View className="gap-md">
            <Text className="text-title font-bold text-primary-deep text-center">
              {t('LeadUnlockSheet.copy9')}
            </Text>
            <Text
              className="text-label text-text-secondary text-center"
              style={{ lineHeight: typography.label * 1.5 }}
            >
              {t('LeadUnlockSheet.copy10')}
            </Text>
            <Button label={t('LeadUnlockSheet.copy11')} onPress={onClose} />
          </View>
        ) : (
          <View className="gap-md">
            <Text className="text-title font-bold text-primary-deep text-center">
              {t('LeadUnlockSheet.copy12')}
            </Text>
            <Text className="text-label text-text-secondary text-center">{customerName}</Text>

            <View className="rounded-md bg-muted p-lg gap-sm">
              <Text className="text-body font-bold text-primary-deep">{taskTitle}</Text>
              <Text className="text-label text-text-secondary">{`${creditCost} кредит`}</Text>
              <Text className="text-label text-text-secondary">{`Үлдэгдэл: ${balance} кредит`}</Text>
              <Text className="text-label text-text-secondary">{`Хүлээх хугацаа: ${formatTimer(minutesRemaining, secondsRemaining)}`}</Text>
              <Text className="text-label text-text-secondary">
                {`Холбоо барих мэдээлэл ${isDiscounted ? t('LeadUnlockSheet.copy13') : ''}`.trim()}
              </Text>
            </View>

            <Text className="text-caption text-text-secondary text-center">
              {t('LeadUnlockSheet.copy14')}
            </Text>

            {isInsufficient ? (
              <>
                <Text className="text-body text-danger text-center">
                  {t('LeadUnlockSheet.copy15')}
                </Text>
                <Button
                  testID="lead-unlock-buy-credits"
                  label={t('LeadUnlockSheet.copy16')}
                  onPress={onBuyCredits}
                  className="min-h-[52]"
                />
                <Button label={t('LeadUnlockSheet.copy17')} variant="ghost" onPress={onDecline} />
              </>
            ) : (
              <>
                <Button
                  label={t('LeadUnlockSheet.copy18')}
                  onPress={onAccept}
                  className="min-h-[52]"
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

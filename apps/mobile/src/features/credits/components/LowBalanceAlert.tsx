import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';

const { colors, radius } = mobileTheme;
const { tint } = mobileSurfaces;

type Severity = 'critical' | 'warning';

interface LowBalanceAlertProps {
  balanceText: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryActionPress: () => void;
  severity?: Severity;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  primaryActionTestID?: string;
  secondaryActionTestID?: string;
  testID?: string;
}

const severityConfig = {
  critical: {
    surfaceBg: tint.dangerSoft,
    border: colors.danger,
    iconBg: tint.dangerSubtle,
    iconColor: colors.danger,
    balanceColor: colors.danger,
  },
  warning: {
    surfaceBg: withAlpha(colors.sunLight, 0.12),
    border: colors.sunLight,
    iconBg: withAlpha(colors.sunLight, 0.1),
    iconColor: colors.sunLight,
    balanceColor: colors.sunLight,
  },
} as const;

export function LowBalanceAlert({
  balanceText,
  description,
  primaryActionLabel,
  onPrimaryActionPress,
  severity = 'critical',
  secondaryActionLabel,
  onSecondaryActionPress,
  primaryActionTestID,
  secondaryActionTestID,
  testID,
}: LowBalanceAlertProps) {
  const { t } = useTranslation();
  const cfg = severityConfig[severity];

  return (
    <View
      style={{ backgroundColor: cfg.surfaceBg, borderColor: cfg.border }}
      className="flex-row gap-md p-lg rounded-lg border"
      testID={testID}
      accessibilityRole="alert"
    >
      <View
        style={{
          backgroundColor: cfg.iconBg,
          width: 36,
          height: 36,
          borderRadius: radius.full,
        }}
        className="items-center justify-center"
      >
        <AlertTriangle size={20} color={cfg.iconColor} />
      </View>
      <View className="flex-1 gap-xs">
        <Text className="font-sans-bold text-label text-foreground">
          {t('tasker.credits.balanceLow')}
        </Text>
        <Text className="font-sans-bold text-label" style={{ color: cfg.balanceColor }}>
          {balanceText}
        </Text>
        <Text className="font-sans text-label text-text-secondary leading-[20px]">
          {description}
        </Text>
        <View className="gap-sm mt-sm">
          <Button
            label={primaryActionLabel}
            onPress={onPrimaryActionPress}
            testID={primaryActionTestID}
            style={{ alignSelf: 'stretch' }}
          />
          {secondaryActionLabel && onSecondaryActionPress ? (
            <Pressable
              onPress={onSecondaryActionPress}
              testID={secondaryActionTestID}
              className="self-start py-xs px-xs"
            >
              <Text className="font-sans-semibold text-label text-primary">
                {secondaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

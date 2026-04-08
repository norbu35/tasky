import React from 'react';
import { Text, View } from 'react-native';
import { Shield, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

type VerificationStatus = 'verified' | 'pending' | 'unverified';
type BadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: BadgeSize;
  testID?: string;
  className?: string;
}

const iconSizeMap: Record<BadgeSize, number> = {
  sm: 12,
  md: 16,
};

export function VerifiedBadge({ status, size = 'sm', testID, className }: VerifiedBadgeProps) {
  const { t } = useTranslation();

  if (status === 'unverified') return null;

  const isVerified = status === 'verified';
  const iconSize = iconSizeMap[size];
  const Icon = isVerified ? ShieldCheck : Shield;

  return (
    <View
      style={{
        backgroundColor: isVerified ? colors.verified : colors.accent,
        paddingVertical: size === 'sm' ? 2 : undefined,
      }}
      className={cn(
        'flex-row items-center rounded-full self-start',
        size === 'md' ? 'px-md py-xs gap-xs' : 'px-sm gap-xs',
        className,
      )}
      testID={testID}
      accessibilityLabel={t(`verification.${status}`)}
    >
      <Icon size={iconSize} color={colors.primaryForeground} />
      {size === 'md' && (
        <Text className="text-micro font-sans-bold text-primary-foreground">
          {t(`verification.${status}`)}
        </Text>
      )}
    </View>
  );
}

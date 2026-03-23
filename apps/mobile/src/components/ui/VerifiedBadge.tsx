import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Shield, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

type VerificationStatus = 'verified' | 'pending' | 'unverified';
type BadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: BadgeSize;
  testID?: string;
}

const iconSizeMap: Record<BadgeSize, number> = {
  sm: 12,
  md: 16,
};

export function VerifiedBadge({ status, size = 'sm', testID }: VerifiedBadgeProps) {
  const { t } = useTranslation();

  if (status === 'unverified') return null;

  const isVerified = status === 'verified';
  const iconSize = iconSizeMap[size];
  const Icon = isVerified ? ShieldCheck : Shield;

  return (
    <View
      style={[
        styles.badge,
        size === 'md' ? styles.badgeMd : styles.badgeSm,
        { backgroundColor: isVerified ? colors.verified : colors.accent },
      ]}
      testID={testID}
      accessibilityLabel={t(`verification.${status}`)}
    >
      <Icon size={iconSize} color={colors.primaryForeground} />
      {size === 'md' && <Text style={styles.text}>{t(`verification.${status}`)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: spacing.xs,
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
});

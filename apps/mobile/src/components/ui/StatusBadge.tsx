import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, typography } = mobileTheme;

type StatusType = 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show';

const statusColors: Record<StatusType, { bg: string; fg: string }> = {
  open: { bg: colors.statusOpen, fg: colors.statusOpenForeground },
  assigned: { bg: colors.statusAssigned, fg: colors.statusAssignedForeground },
  completed: { bg: colors.verified, fg: colors.verifiedForeground },
  cancelled: { bg: colors.muted, fg: colors.mutedForeground },
  no_show: { bg: colors.danger, fg: colors.dangerForeground },
};

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const style = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{t(`status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

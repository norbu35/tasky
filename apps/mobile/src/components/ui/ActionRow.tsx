import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme, withAlpha } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { Touchable } from './Touchable';

const { colors } = mobileTheme;
const pressedBackground = withAlpha(colors.foreground, 0.05);

export interface ActionRowProps {
  /** Left icon — rendered inside a 40×40 tinted circle. */
  icon: React.ReactNode;
  /** Row label text. */
  label: string;
  onPress?: () => void;
  /** Show bottom border separator. Default: true. */
  showDivider?: boolean;
  /** Right slot override. Default: ChevronRight icon. */
  trailing?: React.ReactNode;
  value?: string;
  destructive?: boolean;
  testID?: string;
  className?: string;
}

export function ActionRow({
  icon,
  label,
  onPress,
  showDivider = true,
  trailing,
  value,
  destructive = false,
  testID,
  className,
}: ActionRowProps) {
  const isInteractive = Boolean(onPress);

  return (
    <Touchable
      testID={testID}
      accessibilityRole={isInteractive ? 'button' : undefined}
      onPress={onPress}
      className={cn(
        'flex-row items-center p-md gap-md',
        showDivider && 'border-b border-border/50',
        className,
      )}
      style={({ pressed }) => [isInteractive && pressed && { backgroundColor: pressedBackground }]}
    >
      <View
        className={cn(
          'w-10 h-10 rounded-full items-center justify-center',
          destructive ? 'bg-danger/10' : 'bg-primary/10',
        )}
      >
        {icon}
      </View>
      <Text
        className={cn(
          'flex-1 text-body font-sans-medium',
          destructive ? 'text-danger' : 'text-foreground',
        )}
      >
        {label}
      </Text>
      {trailing != null ? (
        trailing
      ) : value ? (
        <View className="flex-row items-center">
          <Text className="mr-xs text-body text-text-secondary">{value}</Text>
          {isInteractive ? <ChevronRight size={16} color={colors.textTertiary} /> : null}
        </View>
      ) : isInteractive ? (
        <ChevronRight size={16} color={colors.textTertiary} />
      ) : null}
    </Touchable>
  );
}

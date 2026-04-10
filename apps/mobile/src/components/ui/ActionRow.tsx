import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

export interface ActionRowProps {
  /** Left icon — rendered inside a 40×40 tinted circle. */
  icon: React.ReactNode;
  /** Row label text. */
  label: string;
  onPress: () => void;
  /** Show bottom border separator. Default: true. */
  showDivider?: boolean;
  /** Right slot override. Default: ChevronRight icon. */
  trailing?: React.ReactNode;
  testID?: string;
  className?: string;
}

export function ActionRow({
  icon,
  label,
  onPress,
  showDivider = true,
  trailing,
  testID,
  className,
}: ActionRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center p-md gap-md',
        showDivider && 'border-b border-border/50',
        className,
      )}
      style={({ pressed }) => [pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10">
        {icon}
      </View>
      <Text className="flex-1 text-body font-sans-medium text-foreground">{label}</Text>
      {trailing !== undefined ? trailing : (
        <ChevronRight size={20} color={colors.navInactive} />
      )}
    </Pressable>
  );
}

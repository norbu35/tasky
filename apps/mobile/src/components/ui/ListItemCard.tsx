import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

type IconSize = 'sm' | 'md';

const iconSizeClass: Record<IconSize, string> = {
  sm: 'w-11 h-11 rounded-md',
  md: 'w-12 h-12 rounded-md',
};

export interface ListItemCardProps {
  /** Left slot — typically a View wrapping an icon */
  icon?: React.ReactNode;
  /** Icon box visual size. sm: 44×44, md: 48×48. Default: md */
  iconSize?: IconSize;
  /** Primary text. Renders with font-screen-card-title, max 2 lines. */
  title: string;
  /** Secondary text. Renders as caption below title, max 1 line. */
  subtitle?: string;
  /** Top slot inside content area — renders above title (e.g. StatusBadge, category chip). */
  badge?: React.ReactNode;
  /** Right-aligned slot — renders vertically centered (e.g. PriceTag, ChevronRight). */
  trailing?: React.ReactNode;
  onPress: () => void;
  testID?: string;
  className?: string;
}

export function ListItemCard({
  icon,
  iconSize = 'md',
  title,
  subtitle,
  badge,
  trailing,
  onPress,
  testID,
  className,
}: ListItemCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={cn('flex-row items-center gap-md p-lg rounded-lg bg-card', className)}
      style={({ pressed }) => [
        elevations.soft,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      {icon != null && (
        <View className={cn('items-center justify-center shrink-0', iconSizeClass[iconSize])}>
          {icon}
        </View>
      )}
      <View className="flex-1 gap-sm min-w-0">
        {badge}
        <Text className="font-screen-card-title text-primary-deep" numberOfLines={2}>
          {title}
        </Text>
        {subtitle != null && (
          <Text className="text-caption text-text-secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing != null && <View className="shrink-0 self-center">{trailing}</View>}
    </Pressable>
  );
}

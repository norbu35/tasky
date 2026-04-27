import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors, spacing } = mobileTheme;

interface TimelineEvent {
  label: string;
  timestamp: string;
  isActive: boolean;
}

interface TimelineStepperProps {
  events: TimelineEvent[];
  testID?: string;
  className?: string;
}

export function TimelineStepper({ events, testID, className }: TimelineStepperProps) {
  return (
    <View className={cn('py-sm', className)} testID={testID} accessibilityRole="list">
      {events.map((event, index) => {
        const isPast = !event.isActive && index < events.findIndex((e) => e.isActive);
        const isFuture = !event.isActive && index > events.findIndex((e) => e.isActive);
        const isLast = index === events.length - 1;

        const dotColor = event.isActive
          ? colors.primary
          : isPast
            ? colors.verified
            : colors.chipInactive;

        const lineColor = isPast ? colors.verified : colors.chipInactive;

        return (
          <View key={index} className="flex-row min-h-12">
            <View className="w-6 items-center">
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginTop: spacing.xs,
                  backgroundColor: dotColor,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    marginVertical: 2,
                    backgroundColor: lineColor,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg }}>
              <Text
                className={cn('text-body', event.isActive ? 'font-sans-bold' : 'font-sans')}
                style={{
                  color: isFuture ? colors.textTertiary : colors.foreground,
                }}
              >
                {event.label}
              </Text>
              <Text
                className="text-caption"
                style={{
                  color: colors.textSecondary,
                  marginTop: spacing.xs / 2,
                }}
              >
                {event.timestamp}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

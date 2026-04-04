import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

interface TimelineEvent {
  label: string;
  timestamp: string;
  isActive: boolean;
}

interface TimelineStepperProps {
  events: TimelineEvent[];
  testID?: string;
}

export function TimelineStepper({ events, testID }: TimelineStepperProps) {
  return (
    <View style={styles.container} testID={testID} accessibilityRole="list">
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
          <View key={index} style={styles.row}>
            <View style={styles.timeline}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
            </View>
            <View style={styles.content}>
              <Text
                style={[
                  styles.label,
                  event.isActive && styles.activeLabel,
                  isFuture && styles.futureLabel,
                ]}
              >
                {event.label}
              </Text>
              <Text style={styles.timestamp}>{event.timestamp}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: spacing.xs,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body,
    color: colors.foreground,
  },
  activeLabel: {
    fontWeight: '700',
  },
  futureLabel: {
    color: colors.textTertiary,
  },
  timestamp: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
});

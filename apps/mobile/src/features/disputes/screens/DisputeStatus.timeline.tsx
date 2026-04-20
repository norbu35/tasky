import { CircleCheckBig, Circle } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import {
  type DisputeStatus,
  type TimelineState,
  DISPUTE_STATUS_SURFACE,
  getTimelineState,
} from './DisputeStatus.model';

const { colors, spacing } = mobileTheme;
const { tint } = mobileSurfaces;

function TimelineDot({ state }: { state: TimelineState }) {
  if (state === 'done') {
    return (
      <View
        testID="SCR-CUST-025"
        className="rounded-full bg-primary-deep items-center justify-center border-[4px] border-background"
        style={{
          width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          height: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          zIndex: 2,
        }}
      >
        <CircleCheckBig size={10} color={colors.primaryForeground} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View
        className="rounded-full border-[2px] border-secondary bg-background items-center justify-center"
        style={{
          width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          height: DISPUTE_STATUS_SURFACE.timeline.dotSize,
          zIndex: 2,
        }}
      >
        <View
          className="rounded-full bg-secondary"
          style={{
            width: DISPUTE_STATUS_SURFACE.timeline.innerDotSize,
            height: DISPUTE_STATUS_SURFACE.timeline.innerDotSize,
          }}
        />
      </View>
    );
  }
  return (
    <View
      className="rounded-full border-[2px] border-border bg-background items-center justify-center"
      style={{
        width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
        height: DISPUTE_STATUS_SURFACE.timeline.dotSize,
        zIndex: 2,
      }}
    >
      <Circle size={8} color={colors.border} fill={colors.border} />
    </View>
  );
}

export function TimelineSection({
  timeline,
  status,
  sectionTitle,
}: {
  timeline: { title: string; description: string; date?: string }[];
  status: DisputeStatus;
  sectionTitle: string;
}) {
  return (
    <View className="gap-lg">
      <Text className="text-heading font-sans-bold text-primary-deep">{sectionTitle}</Text>
      <View className="gap-lg" style={{ position: 'relative' }}>
        {timeline.map((item, index) => {
          const state = getTimelineState(status, index);
          const isLast = index === timeline.length - 1;
          return (
            <View key={item.title} className="flex-row gap-item">
              <View
                className="items-center"
                style={{
                  width: DISPUTE_STATUS_SURFACE.timeline.dotSize,
                  position: 'relative',
                }}
              >
                <TimelineDot state={state} />
                {!isLast ? (
                  <View
                    className="absolute"
                    style={{
                      width: DISPUTE_STATUS_SURFACE.timeline.lineWidth,
                      top: DISPUTE_STATUS_SURFACE.timeline.dotSize,
                      bottom: -spacing.lg,
                      backgroundColor: tint.borderSoft,
                    }}
                  />
                ) : null}
              </View>
              <View className="flex-1 gap-xs pb-item">
                <Text
                  className={cn(
                    'text-body font-sans-bold text-primary-deep',
                    state === 'future' && 'text-text-secondary',
                  )}
                >
                  {item.title}
                </Text>
                <Text
                  className={cn(
                    'text-body text-text-secondary leading-normal',
                    state === 'future' && 'text-text-tertiary',
                  )}
                >
                  {item.description}
                </Text>
                {item.date ? (
                  <View className="self-start rounded-sm bg-muted px-sm py-xs">
                    <Text className="text-caption text-text-secondary">{item.date}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

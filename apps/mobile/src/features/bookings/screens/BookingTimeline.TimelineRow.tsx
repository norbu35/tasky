import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { formatDateTime } from '@/utils/formatDate';

import { getEventLabel, type TimelineEvent } from './BookingTimeline.model';

const { colors } = mobileTheme;
const { bookingTimeline } = mobileSurfaces;

export function TimelineEventRow({
  index,
  event,
  isActive,
  isFuture,
  t,
}: {
  index: number;
  event: TimelineEvent;
  isActive: boolean;
  isFuture: boolean;
  t: (key: string) => string;
}) {
  const dotBg = isActive ? colors.secondary : isFuture ? colors.chipInactive : colors.primaryDeep;

  return (
    <View
      className={`flex-row gap-md items-start${isFuture ? ' opacity-[0.45]' : ''}`}
      testID={`timeline-event-${index}-${isFuture ? 'future' : isActive ? 'active' : 'past'}`}
    >
      <View className="w-6 items-center">
        <View
          className="rounded-full border-[3px] z-[1]"
          style={{
            width: bookingTimeline.dotSize,
            height: bookingTimeline.dotSize,
            borderColor: colors.background,
            backgroundColor: dotBg,
          }}
        />
        {!isFuture ? (
          <View
            className="flex-1 bg-border"
            style={{
              width: bookingTimeline.railWidth,
              minHeight: bookingTimeline.railMinHeight,
              marginTop: bookingTimeline.railOffset,
            }}
          />
        ) : (
          <View
            className="flex-1 bg-border opacity-50"
            style={{
              width: bookingTimeline.railWidth,
              minHeight: bookingTimeline.railMinHeight,
              marginTop: bookingTimeline.railOffset,
            }}
          />
        )}
      </View>
      <View className="flex-1 gap-xs">
        <Text
          className={`text-micro font-bold${isActive ? ' text-secondary' : ' text-text-secondary'}`}
        >
          {formatDateTime(event.timestamp)}
        </Text>
        <Text
          className={`text-body font-bold${isActive ? ' text-secondary' : ' text-primary-deep'}`}
        >
          {getEventLabel(event.event, t)}
        </Text>
        {event.description ? (
          <Text className="text-caption text-text-secondary leading-relaxed">
            {event.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

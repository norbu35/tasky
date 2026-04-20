import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useBookingDetail } from '../hooks/useBookingDetail';
import { useBookingTimeline } from '../hooks/useBookingTimeline';

import { type TimelineEvent } from './BookingTimeline.model';

export { type TimelineEvent } from './BookingTimeline.model';

export interface BookingTimelineScreenState {
  bookingId: string;
  booking: ReturnType<typeof useBookingDetail>['data'];
  timelineEvents: TimelineEvent[];
  activeIndex: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useBookingTimelineScreen(): BookingTimelineScreenState {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: events, isLoading, isError, refetch } = useBookingTimeline(bookingId);
  const { data: booking } = useBookingDetail(bookingId);

  const timelineEvents = React.useMemo(() => (events ?? []) as TimelineEvent[], [events]);
  const activeIndex = React.useMemo(() => {
    const lastNonFuture = timelineEvents.reduce<number>((acc, event, index) => {
      if (!event.is_future) return index;
      return acc;
    }, 0);
    return lastNonFuture;
  }, [timelineEvents]);

  return {
    bookingId,
    booking,
    timelineEvents,
    activeIndex,
    isLoading,
    isError,
    refetch,
  };
}

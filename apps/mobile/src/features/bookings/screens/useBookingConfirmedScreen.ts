import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Platform } from 'react-native';

export interface BookingConfirmedScreenState {
  bookingId: string | undefined;
  taskerName: string | undefined;
  canAddToCalendar: boolean;
  handleViewBooking: () => void;
  handleDone: () => void;
  handleMessage: () => void;
}

export function useBookingConfirmedScreen(): BookingConfirmedScreenState {
  const router = useRouter();
  const { bookingId, taskerName } = useLocalSearchParams<{
    bookingId: string;
    taskerName?: string;
  }>();
  const [canAddToCalendar, setCanAddToCalendar] = React.useState(false);
  const canAddToCalendarRef = React.useRef(canAddToCalendar);

  React.useEffect(() => {
    canAddToCalendarRef.current = canAddToCalendar;
  }, [canAddToCalendar]);

  React.useEffect(() => {
    let cancelled = false;
    const candidate = Platform.OS === 'ios' ? 'calshow:0' : 'content://com.android.calendar/time';

    void Linking.canOpenURL(candidate)
      .then((canOpen: boolean) => {
        if (!cancelled && canOpen !== canAddToCalendarRef.current) {
          canAddToCalendarRef.current = canOpen;
          setCanAddToCalendar(canOpen);
        }
      })
      .catch(() => {
        if (!cancelled && canAddToCalendarRef.current) {
          canAddToCalendarRef.current = false;
          setCanAddToCalendar(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewBooking = React.useCallback(() => {
    if (!bookingId) {
      router.replace('/(customer)/bookings');
      return;
    }
    router.replace(`/(customer)/bookings/${bookingId}`);
  }, [bookingId, router]);

  const handleDone = React.useCallback(() => {
    router.replace('/(customer)/bookings');
  }, [router]);

  const handleMessage = React.useCallback(() => {
    router.push(bookingId ? `/inbox/${bookingId}` : '/inbox');
  }, [bookingId, router]);

  return {
    bookingId,
    taskerName,
    canAddToCalendar,
    handleViewBooking,
    handleDone,
    handleMessage,
  };
}

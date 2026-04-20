import { useRouter } from 'expo-router';
import React from 'react';

import { useBookings } from '@/features/bookings/hooks/useBookings';
import type { Booking } from '@/lib/api/types';

import { type BookingTab, isActiveStatus, isCompletedStatus } from './model';

export interface BookingsListScreenState {
  activeTab: BookingTab;
  setActiveTab: React.Dispatch<React.SetStateAction<BookingTab>>;
  isRefreshing: boolean;
  bookings: Booking[];
  filteredBookings: Booking[];
  isLoading: boolean;
  isError: boolean;
  showEmptyState: boolean;
  showList: boolean;
  showOfflineBanner: boolean;
  handleRefresh: () => Promise<void>;
  handleBookingPress: (bookingId: string) => void;
  handlePostTask: () => void;
  refetch: () => void;
}

export function useBookingsListScreen(): BookingsListScreenState {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBookings();
  const [activeTab, setActiveTab] = React.useState<BookingTab>('active');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const bookings = data?.data ?? [];
  const filteredBookings = bookings.filter((booking) =>
    activeTab === 'active' ? isActiveStatus(booking.status) : isCompletedStatus(booking.status),
  );

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleBookingPress = React.useCallback(
    (bookingId: string) => {
      router.push(`/(customer)/bookings/${bookingId}`);
    },
    [router],
  );

  const handlePostTask = React.useCallback(() => {
    router.push('/(customer)/tasks/new');
  }, [router]);

  const showEmptyState = !isLoading && bookings.length === 0;
  const showList = !isLoading && bookings.length > 0;
  const showOfflineBanner = isError && bookings.length > 0;

  return {
    activeTab,
    setActiveTab,
    isRefreshing,
    bookings,
    filteredBookings,
    isLoading,
    isError,
    showEmptyState,
    showList,
    showOfflineBanner,
    handleRefresh,
    handleBookingPress,
    handlePostTask,
    refetch,
  };
}

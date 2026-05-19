import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import RescheduleScreen from '../../../../src/app/(customer)/bookings/[bookingId]/reschedule';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'b-1' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = jest.requireActual<
    typeof import('../../../test-utils/mockI18n')
  >('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: React.ComponentProps<typeof Text>) => (
        <Text testID={`icon-${String(name)}`} {...props} />
      ),
    },
  );
});

const mockReschedule = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useReschedule', () => ({
  useReschedule: () => ({
    mutateAsync: mockReschedule,
    isPending: false,
  }),
}));

const mockUseBookingDetail = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookingDetail', () => ({
  useBookingDetail: (id: string) => mockUseBookingDetail(id),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockUseBookingDetail.mockReturnValue({
    data: {
      id: 'b-1',
      confirmed_scheduled_at: '2026-04-01T10:00:00Z',
      task: {},
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('RescheduleScreen (SCR-CUST-020)', () => {
  it('has a testID on the screen container', () => {
    render(<RescheduleScreen />);
    expect(screen.getByTestId('SCR-CUST-020')).toBeTruthy();
  });

  it('renders proposed date/time fields that open the shared picker sheet', () => {
    render(<RescheduleScreen />);

    expect(screen.getByTestId('reschedule-date-input')).toBeTruthy();
    expect(screen.getByTestId('reschedule-time-input')).toBeTruthy();
    expect(screen.queryByTestId('schedule-picker-sheet')).toBeNull();

    fireEvent.press(screen.getByTestId('reschedule-date-input'));

    expect(screen.getByTestId('schedule-picker-sheet')).toBeTruthy();
    expect(screen.getByTestId('schedule-picker-date-tab')).toBeTruthy();
  });

  it('shows the current schedule at the top in Mongolian date format', () => {
    render(<RescheduleScreen />);
    expect(screen.getByText('Одоогийн хуваарь')).toBeTruthy();
    expect(screen.getByText(/2026.*18:00/)).toBeTruthy();
  });

  it('renders reason field', () => {
    render(<RescheduleScreen />);
    expect(screen.getByText('Шалтгаан')).toBeTruthy();
    expect(screen.getByText('Заавал биш')).toBeTruthy();
    expect(screen.getByPlaceholderText('Цаг өөрчлөх шалтгаан...')).toBeTruthy();
  });

  it('SCN-BOOK-017: Reschedule request in ASSIGNED creates a REQUESTED event with proposed datetime and optional reason', async () => {
    mockReschedule.mockResolvedValue({ id: 'rs-1' });
    render(<RescheduleScreen />);

    fireEvent.press(screen.getByTestId('reschedule-time-input'));
    fireEvent.press(screen.getByTestId('schedule-time-option-4'));
    fireEvent.press(screen.getByTestId('schedule-picker-save'));
    fireEvent.changeText(
      screen.getByPlaceholderText('Цаг өөрчлөх шалтгаан...'),
      'Schedule conflict',
    );
    fireEvent.press(screen.getByTestId('reschedule-screen-next'));

    await waitFor(() => {
      expect(mockReschedule).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'b-1',
          proposed_scheduled_at: expect.any(String),
          reason: 'Schedule conflict',
          idempotencyKey: expect.any(String),
        }),
      );
    });
  });

  it('keeps the user on an awaiting state after submit instead of navigating back immediately', async () => {
    mockReschedule.mockResolvedValue({ id: 'rs-1' });
    render(<RescheduleScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Цаг өөрчлөх шалтгаан...'),
      'Schedule conflict',
    );
    fireEvent.press(screen.getByTestId('reschedule-screen-next'));

    await waitFor(() => {
      expect(screen.getByText('Хүлээж байна')).toBeTruthy();
    });
    expect(screen.queryByTestId('reschedule-date-input')).toBeNull();
    expect(screen.queryByTestId('reschedule-time-input')).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows an inline submit error when the reschedule request fails', async () => {
    mockReschedule.mockRejectedValue(new Error('Network unavailable'));
    render(<RescheduleScreen />);

    fireEvent.press(screen.getByTestId('reschedule-screen-next'));

    await waitFor(() => {
      expect(screen.getByText('Хүсэлт илгээж чадсангүй. Дахин оролдоно уу.')).toBeTruthy();
    });
  });

  it('shows schedule authority note', () => {
    render(<RescheduleScreen />);
    expect(
      screen.getByText('Цагийн өөрчлөлт зөвхөн нөгөө тал зөвшөөрсний дараа хүчинтэй болно'),
    ).toBeTruthy();
  });
});

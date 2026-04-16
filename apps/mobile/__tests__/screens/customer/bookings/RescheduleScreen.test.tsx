import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import RescheduleScreen from '../../../../src/app/(customer)/bookings/[bookingId]/reschedule';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'b-1' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
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
      task: {
        scheduled_at: '2026-04-01T10:00:00Z',
      },
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

  it('renders date/time picker field', () => {
    render(<RescheduleScreen />);
    expect(screen.getByTestId('reschedule-screen-date-picker')).toBeTruthy();
  });

  it('shows the current schedule at the top in Mongolian date format', () => {
    render(<RescheduleScreen />);
    expect(screen.getByText('Одоогийн хуваарь')).toBeTruthy();
    expect(screen.getByText('2026.04.01 18:00')).toBeTruthy();
  });

  it('renders reason field', () => {
    render(<RescheduleScreen />);
    expect(screen.getByText('Шалтгаан')).toBeTruthy();
    expect(screen.getByText('Заавал биш')).toBeTruthy();
    expect(screen.getByPlaceholderText('Цаг өөрчлөх шалтгаан...')).toBeTruthy();
  });

  it('submit calls reschedule with ISO date', async () => {
    mockReschedule.mockResolvedValue({ id: 'rs-1' });
    render(<RescheduleScreen />);
    // Simulate date selection by pressing the date picker
    fireEvent.press(screen.getByTestId('reschedule-screen-date-picker'));
    // Fill reason
    fireEvent.changeText(
      screen.getByPlaceholderText('Цаг өөрчлөх шалтгаан...'),
      'Schedule conflict',
    );
    // Submit
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
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows schedule authority note', () => {
    render(<RescheduleScreen />);
    expect(
      screen.getByText('Цагийн өөрчлөлт зөвхөн нөгөө тал зөвшөөрсний дараа хүчинтэй болно'),
    ).toBeTruthy();
  });
});

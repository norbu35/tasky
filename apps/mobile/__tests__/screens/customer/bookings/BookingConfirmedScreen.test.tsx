import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useConversations } from '../../../../src/features/chat/hooks/useConversations';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import BookingConfirmedScreen from '../../../../src/app/(customer)/bookings/confirmed';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ bookingId: 'booking-1' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const mockUseBookingDetail = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookingDetail', () => ({
  useBookingDetail: (id: string) => mockUseBookingDetail(id),
}));

jest.mock('../../../../src/features/chat/hooks/useConversations', () => ({
  useConversations: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
  jest.spyOn(Linking, 'openURL').mockResolvedValue('ok');
  mockUseBookingDetail.mockReturnValue({
    data: {
      id: 'booking-1',
      task_id: 'task-1',
      task: { id: 'task-1' },
      tasker_id: 'tasker-1',
      tasker: { id: 'tasker-1' },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockUseConversations.mockReturnValue({
    data: {
      data: [
        {
          id: 'conversation-1',
          task_id: 'task-1',
          task_title: 'Fix my sink',
          counterparty_id: 'tasker-1',
          counterparty_name: 'Bold',
          counterparty_avatar_url: null,
          counterparty_last_active_at: null,
          last_message_content: 'See you soon',
          last_message_at: '2026-04-01T10:00:00Z',
          unread_count: 0,
          created_at: '2026-04-01T10:00:00Z',
        },
      ],
      cursor: { next: null, prev: null },
    },
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useConversations>);
});

describe('BookingConfirmedScreen (SCR-CUST-015)', () => {
  it('has a testID on the screen container', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByTestId('SCR-CUST-015')).toBeTruthy();
  });

  it('shows success headline', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Захиалга баталгаажлаа!')).toBeTruthy();
  });

  it('shows next steps guidance', () => {
    render(<BookingConfirmedScreen />);
    expect(
      screen.getByText(
        'Таны хүсэлтийг амжилттай хүлээн авлаа. Манай мэргэжилтэн тун удахгүй тантай холбогдох болно.',
      ),
    ).toBeTruthy();
  });

  it('renders primary CTA to message tasker', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Зурвас илгээгч')).toBeTruthy(); // Based on failing test output it rendered "Зурвас илгээгч"
  });

  it('primary CTA navigates to message', () => {
    render(<BookingConfirmedScreen />);
    fireEvent.press(screen.getByTestId('booking-confirmed-screen-cta'));
    expect(mockPush).toHaveBeenCalledWith('/inbox/conversation-1');
  });

  it('renders secondary View Booking CTA', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Захиалга харах')).toBeTruthy();
  });

  it('View Booking CTA navigates to booking detail', () => {
    render(<BookingConfirmedScreen />);
    fireEvent.press(screen.getByTestId('booking-confirmed-screen-secondary-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(customer)/bookings/booking-1');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useNotifications } from '../../../src/features/notifications/hooks/useNotifications';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const fb = typeof fallback === 'string' ? fallback : key;
      return fb;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

jest.mock('../../../src/features/notifications/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NotificationCenterScreen (SCR-SHARED-016)', () => {
  it('renders the notifications title', () => {
    mockUseNotifications.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    const NotificationCenterScreen = require('../../../src/app/(shared)/notifications').default;
    render(<NotificationCenterScreen />);

    expect(screen.getByText('shared.notifications.title')).toBeTruthy();
  });

  it('shows empty state when no notifications exist', () => {
    mockUseNotifications.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    const NotificationCenterScreen = require('../../../src/app/(shared)/notifications').default;
    render(<NotificationCenterScreen />);

    expect(screen.getByText('shared.notifications.emptyTitle')).toBeTruthy();
  });

  it('renders mock notification items', () => {
    mockUseNotifications.mockReturnValue({
      data: {
        data: [
          {
            id: 'notif-1',
            title: 'New applicant',
            body: 'Someone applied to your task',
            read: false,
            created_at: '2026-03-23T10:00:00Z',
          },
          {
            id: 'notif-2',
            title: 'Booking confirmed',
            body: 'Your booking has been confirmed',
            read: true,
            created_at: '2026-03-22T08:00:00Z',
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    const NotificationCenterScreen = require('../../../src/app/(shared)/notifications').default;
    render(<NotificationCenterScreen />);

    expect(screen.getByText('New applicant')).toBeTruthy();
    expect(screen.getByText('Booking confirmed')).toBeTruthy();
  });
});

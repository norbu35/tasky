import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
import { useNotifications } from '../../../src/features/notifications/hooks/useNotifications';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
  resetTestI18n();
  setTestLanguage('mn');
});

describe('NotificationCenterScreen (SCR-SHARED-016)', () => {
  it('renders the notification center screen container', () => {
    mockUseNotifications.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    const NotificationCenterScreen = require('../../../src/app/(shared)/notifications').default;
    render(<NotificationCenterScreen />);

    // Title is rendered by the Expo Router native stack header (not in component tree);
    // verify the screen container is present via testID instead.
    expect(screen.getByTestId('SCR-SHARED-016')).toBeTruthy();
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

    expect(screen.getByText('Мэдэгдэл байхгүй байна')).toBeTruthy();
    expect(screen.getByText('Та бүх зүйлтэй танилцсан байна')).toBeTruthy();
  });

  it('shows a retryable error state when the request fails', () => {
    const refetch = jest.fn();
    mockUseNotifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isRefetching: false,
      refetch,
    } as unknown as ReturnType<typeof useNotifications>);

    const NotificationCenterScreen = require('../../../src/app/(shared)/notifications').default;
    render(<NotificationCenterScreen />);

    expect(screen.getByText('Алдаа гарлаа')).toBeTruthy();
    expect(screen.getByText('Мэдэгдлүүдийг ачаалахад алдаа гарлаа')).toBeTruthy();
    fireEvent.press(screen.getByTestId('notifications-error-retry'));
    expect(refetch).toHaveBeenCalled();
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
            created_at: '2026-03-26T10:00:00Z',
          },
          {
            id: 'notif-2',
            title: 'Booking confirmed',
            body: 'Your booking has been confirmed',
            read: true,
            created_at: '2026-03-24T08:00:00Z',
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

    expect(screen.getByText('Өнөөдөр')).toBeTruthy();
    expect(screen.getByText('Өмнөх')).toBeTruthy();
    expect(screen.getByText('New applicant')).toBeTruthy();
    expect(screen.getByText('Booking confirmed')).toBeTruthy();
    expect(screen.getByTestId('notification-unread-dot-notif-1')).toBeTruthy();
  });

  it('pressing a notification item navigates to inbox', () => {
    mockUseNotifications.mockReturnValue({
      data: {
        data: [
          {
            id: 'notif-nav',
            title: 'New task',
            body: 'A new task is available',
            read: false,
            created_at: '2026-03-26T10:00:00Z',
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

    // Back navigation is now delegated to the Expo Router native stack header;
    // verify item press navigates to inbox instead.
    fireEvent.press(screen.getByTestId('notification-item-notif-nav'));
    expect(mockPush).toHaveBeenCalled();
  });
});

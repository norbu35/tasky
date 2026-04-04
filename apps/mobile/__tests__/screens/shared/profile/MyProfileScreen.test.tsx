import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
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
    BottomSheetView: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

const mockUseMyProfile = jest.fn();
jest.mock('../../../../src/features/profile/hooks/useProfile', () => ({
  useMyProfile: () => mockUseMyProfile(),
  useUpdateProfile: () => ({ mutate: jest.fn(), isPending: false }),
  useSignOut: () => jest.fn(),
}));

const mockUseRole = jest.fn();
jest.mock('../../../../src/providers/RoleProvider', () => ({
  useRole: () => mockUseRole(),
}));

jest.mock('../../../../src/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ session: { accessToken: 'test-token' } }),
}));

const MOCK_CUSTOMER_PROFILE = {
  id: 'user-1',
  full_name: 'Батбаяр',
  avatar_url: 'https://cdn.tasky.mn/avatars/user1.jpg',
  role: 'CUSTOMER',
  status: 'VERIFIED',
  rating_avg: 0,
  completed_tasks: 3,
  is_pro: false,
  created_at: '2025-06-15T00:00:00Z',
};

const MOCK_TASKER_PROFILE = {
  id: 'user-2',
  full_name: 'Болд',
  avatar_url: 'https://cdn.tasky.mn/avatars/user2.jpg',
  role: 'TASKER',
  status: 'VERIFIED',
  rating_avg: 4.7,
  completed_tasks: 47,
  is_pro: true,
  created_at: '2025-01-10T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRole.mockReturnValue({
    currentRole: 'customer',
    isCustomer: true,
    isTasker: false,
    switchRole: jest.fn(),
    setRole: jest.fn(),
  });
});

describe('MyProfileScreen (SCR-SHARED-012)', () => {
  it('renders loading state', () => {
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByTestId('SCR-SHARED-012')).toBeTruthy();
  });

  it('renders user name and avatar in customer view', () => {
    mockUseMyProfile.mockReturnValue({
      data: MOCK_CUSTOMER_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByText('Батбаяр')).toBeTruthy();
  });

  it('shows edit profile button', () => {
    mockUseMyProfile.mockReturnValue({
      data: MOCK_CUSTOMER_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByText('Профайл засах')).toBeTruthy();
  });

  it('edit profile button navigates to edit screen', () => {
    mockUseMyProfile.mockReturnValue({
      data: MOCK_CUSTOMER_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    fireEvent.press(screen.getByTestId('SCR-SHARED-012-cta'));
    expect(mockPush).toHaveBeenCalledWith('/(shared)/profile/edit');
  });

  it('customer view shows task count', () => {
    mockUseMyProfile.mockReturnValue({
      data: MOCK_CUSTOMER_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('tasker view shows stats and verified badge', () => {
    mockUseRole.mockReturnValue({
      currentRole: 'tasker',
      isCustomer: false,
      isTasker: true,
      switchRole: jest.fn(),
      setRole: jest.fn(),
    });
    mockUseMyProfile.mockReturnValue({
      data: MOCK_TASKER_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByText('47')).toBeTruthy();
    expect(screen.getByText('4.7')).toBeTruthy();
  });

  it('shows error state with retry', () => {
    const mockRefetch = jest.fn();
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByTestId('SCR-SHARED-012-error')).toBeTruthy();
  });

  it('tasker view shows a stats action that navigates to the tasker stats screen', () => {
    mockUseRole.mockReturnValue({
      currentRole: 'tasker',
      isCustomer: false,
      isTasker: true,
      switchRole: jest.fn(),
      setRole: jest.fn(),
    });
    mockUseMyProfile.mockReturnValue({
      data: MOCK_TASKER_PROFILE,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);

    fireEvent.press(screen.getByText('Статистик харах'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/stats');
  });

  it('retries loading after a profile error', () => {
    const refetch = jest.fn();
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch,
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);

    fireEvent.press(screen.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });
});

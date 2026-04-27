import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
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

const mockUseTaskerProfile = jest.fn();
jest.mock('../../../../src/features/profile/hooks/useTaskerProfile', () => ({
  useTaskerProfile: () => mockUseTaskerProfile(),
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
  resetTestI18n();
  setTestLanguage('mn');
  mockUseTaskerProfile.mockReturnValue({
    reviews: { data: { data: [] }, isLoading: false, isError: false },
  });
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
    expect(screen.getByTestId('my-profile-hero-card')).toBeTruthy();
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
    expect(screen.getByTestId('action-row-edit-profile')).toBeTruthy();
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
    fireEvent.press(screen.getByTestId('action-row-edit-profile'));
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
    mockUseTaskerProfile.mockReturnValue({
      reviews: {
        data: {
          data: [{ id: 'review-1' }, { id: 'review-2' }, { id: 'review-3' }],
        },
        isLoading: false,
        isError: false,
      },
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);
    expect(screen.getByText('47')).toBeTruthy();
    expect(screen.getAllByText('4.7').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('my-profile-reputation-summary')).toBeTruthy();
  });

  it('tasker view hides aggregate rating below the public review threshold', () => {
    mockUseRole.mockReturnValue({
      currentRole: 'tasker',
      isCustomer: false,
      isTasker: true,
      switchRole: jest.fn(),
      setRole: jest.fn(),
    });
    mockUseMyProfile.mockReturnValue({
      data: { ...MOCK_TASKER_PROFILE, completed_tasks: 47, rating_avg: 4.7 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const MyProfileScreen = require('../../../../src/app/(tabs)/profile').default;
    render(<MyProfileScreen />);

    expect(screen.queryByText('4.7')).toBeNull();
    expect(screen.getByText('Одоогоор хангалттай шүүмж алга')).toBeTruthy();
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

    fireEvent.press(screen.getByText('Дахин оролдох'));
    expect(refetch).toHaveBeenCalled();
  });
});

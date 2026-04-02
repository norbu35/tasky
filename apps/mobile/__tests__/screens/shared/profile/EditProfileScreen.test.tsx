import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockPush = jest.fn();

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

const mockMutate = jest.fn();
const mockUseMyProfile = jest.fn();
const mockUseUpdateProfile = jest.fn();

jest.mock('../../../../src/features/profile/hooks/useProfile', () => ({
  useMyProfile: () => mockUseMyProfile(),
  useUpdateProfile: () => mockUseUpdateProfile(),
  useSignOut: () => jest.fn(),
}));

jest.mock('../../../../src/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ session: { accessToken: 'test-token' } }),
}));

const MOCK_PROFILE = {
  id: 'user-1',
  full_name: 'Батбаяр',
  avatar_url: 'https://cdn.tasky.mn/avatars/user1.jpg',
  bio: 'Reliable helper',
  role: 'CUSTOMER',
  status: 'VERIFIED',
  rating_avg: 0,
  completed_tasks: 3,
  is_pro: false,
  created_at: '2025-06-15T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMyProfile.mockReturnValue({
    data: MOCK_PROFILE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockUseUpdateProfile.mockReturnValue({ mutate: mockMutate, isPending: false });
});

describe('EditProfileScreen (SCR-SHARED-013)', () => {
  it('renders the edit profile header with Save button', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);
    expect(screen.getByTestId('edit-profile-screen')).toBeTruthy();
    expect(screen.getByText('Хадгалах')).toBeTruthy();
  });

  it('renders name input pre-filled with current name', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);
    expect(screen.getByDisplayValue('Батбаяр')).toBeTruthy();
  });

  it('renders change photo button', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);
    expect(screen.getByText('Зураг солих')).toBeTruthy();
  });

  it('save button calls updateMyProfile with changed name', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);
    const nameInput = screen.getByDisplayValue('Батбаяр');
    fireEvent.changeText(nameInput, 'Болд');
    fireEvent.press(screen.getByTestId('edit-profile-screen-next'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Болд' }),
      expect.anything(),
    );
  });

  it('shows validation error when name is empty', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);
    const nameInput = screen.getByDisplayValue('Батбаяр');
    fireEvent.changeText(nameInput, '');
    fireEvent.press(screen.getByTestId('edit-profile-screen-next'));
    expect(screen.getByText('Нэр хоосон байж болохгүй')).toBeTruthy();
  });

  it('shows loading state on save button when saving', () => {
    mockUseUpdateProfile.mockReturnValue({ mutate: mockMutate, isPending: true });
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);
    expect(screen.getByTestId('edit-profile-screen')).toBeTruthy();
  });

  it('prefills the bio field from the current profile', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);

    expect(screen.getByDisplayValue('Reliable helper')).toBeTruthy();
  });

  it('keeps save disabled until the form is modified', () => {
    const EditProfileScreen = require('../../../../src/app/(shared)/profile/edit').default;
    render(<EditProfileScreen />);

    expect(screen.getByTestId('edit-profile-screen-next').props.accessibilityState.disabled).toBe(
      true,
    );

    fireEvent.changeText(screen.getByDisplayValue('Батбаяр'), 'Болд');

    expect(screen.getByTestId('edit-profile-screen-next').props.accessibilityState.disabled).toBe(
      false,
    );
  });
});

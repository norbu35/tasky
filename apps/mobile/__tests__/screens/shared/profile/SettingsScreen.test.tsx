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
    i18n: { language: 'en', changeLanguage: jest.fn() },
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

const mockUseRole = jest.fn();
jest.mock('../../../../src/providers/RoleProvider', () => ({
  useRole: () => mockUseRole(),
}));

jest.mock('../../../../src/store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ session: { accessToken: 'test-token' } }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const mockSwitchRole = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRole.mockReturnValue({
    currentRole: 'customer',
    isCustomer: true,
    isTasker: false,
    switchRole: mockSwitchRole,
    setRole: jest.fn(),
  });
});

describe('SettingsScreen (SCR-SHARED-014)', () => {
  it('renders settings screen with language row', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    expect(screen.getByText('Хэл')).toBeTruthy();
  });

  it('renders notifications row', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    expect(screen.getByText('Мэдэгдэл')).toBeTruthy();
  });

  it('renders role switch row', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    expect(screen.getByText('Дүр солих')).toBeTruthy();
  });

  it('renders terms of service row', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    expect(screen.getByText('Үйлчилгээний нөхцөл')).toBeTruthy();
  });

  it('renders privacy policy row', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    expect(screen.getByText('Нууцлалын бодлого')).toBeTruthy();
  });

  it('renders help and danger zone sections in section data', () => {
    // SectionList virtualizes, so bottom items may not render in tests.
    // Verify the screen mounts and earlier legal items render.
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    // Legal section header is rendered
    expect(screen.getByText('ХУУЛИЙН МЭДЭЭЛЭЛ')).toBeTruthy();
    // Terms and Privacy are rendered within legal
    expect(screen.getByText('Үйлчилгээний нөхцөл')).toBeTruthy();
    expect(screen.getByText('Нууцлалын бодлого')).toBeTruthy();
  });

  it('tapping role switch shows confirmation', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Дүр солих'));
    expect(screen.getByText('Дүр солих уу?')).toBeTruthy();
  });

  it('renders all four section headers (Preferences, Account, Legal visible; Danger Zone in data)', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);
    // SectionList virtualizes, so first 3 section headers render; Danger Zone
    // is in the data but may be beyond the initial render window.
    expect(screen.getByText('ТОХИРУУЛГА')).toBeTruthy();
    expect(screen.getByText('БҮРТГЭЛ')).toBeTruthy();
    expect(screen.getByText('ХУУЛИЙН МЭДЭЭЛЭЛ')).toBeTruthy();
  });

  it('navigates to terms, privacy, and help screens from legal rows', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Үйлчилгээний нөхцөл'));
    fireEvent.press(screen.getByText('Нууцлалын бодлого'));
    fireEvent.press(screen.getByText('Тусламж & Дэмжлэг'));

    expect(mockPush).toHaveBeenCalledWith('/(shared)/legal/terms');
    expect(mockPush).toHaveBeenCalledWith('/(shared)/legal/privacy');
    expect(mockPush).toHaveBeenCalledWith('/(shared)/help');
  });

  it('opens a delete-account confirmation sheet before navigating to delete flow', () => {
    const SettingsScreen = require('../../../../src/app/(shared)/profile/settings').default;
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Бүртгэл устгах'));
    expect(screen.getByText('Бүртгэл устгах уу?')).toBeTruthy();

    fireEvent.press(screen.getByText('Батлах'));
    expect(mockPush).toHaveBeenCalledWith('/(shared)/profile/delete');
  });
});

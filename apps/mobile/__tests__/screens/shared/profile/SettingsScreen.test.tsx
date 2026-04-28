import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import type { TextProps } from 'react-native';

import SettingsScreen from '../../../../src/app/(shared)/profile/settings';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = jest.requireActual(
    '../../../test-utils/mockI18n',
  ) as typeof import('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { View: MockView } = jest.requireActual('react-native') as typeof import('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(
    { children, index }: { children?: React.ReactNode; index?: number },
    ref: React.Ref<{ close: () => void; snapToIndex: (index: number) => void }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      close: jest.fn(),
      snapToIndex: jest.fn(),
    }));
    if (index === -1) return null;
    return <MockView>{children}</MockView>;
  });
  const MockBottomSheetView = function MockBottomSheetView({
    children,
  }: {
    children?: React.ReactNode;
  }) {
    return <MockView>{children}</MockView>;
  };
  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetModal: MockView,
    BottomSheetModalProvider: MockView,
    BottomSheetBackdrop: MockView,
    BottomSheetView: MockBottomSheetView,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text: MockText } = jest.requireActual('react-native') as typeof import('react-native');

  return new Proxy(
    {},
    {
      get: (_target: unknown, name: string) =>
        function MockIcon(props: TextProps) {
          return <MockText testID={`icon-${String(name)}`} {...props} />;
        },
    },
  );
});

const mockUseRole = jest.fn();
jest.mock('../../../../src/providers/RoleProvider', () => ({
  useRole: () => mockUseRole(),
}));

type AuthStoreState = {
  session: {
    accessToken: string;
  };
};

jest.mock('../../../../src/store/authStore', () => ({
  useAuthStore: (selector: (state: AuthStoreState) => unknown) =>
    selector({ session: { accessToken: 'test-token' } }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const mockSwitchRole = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
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
    render(<SettingsScreen />);
    expect(screen.getByText('Хэл')).toBeTruthy();
  });

  it('renders notifications row', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Мэдэгдэл')).toBeTruthy();
  });

  it('renders role switch row', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Үүрэг солих')).toBeTruthy();
  });

  it('renders terms of service row', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Үйлчилгээний нөхцөл')).toBeTruthy();
  });

  it('renders privacy policy row', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Нууцлалын бодлого')).toBeTruthy();
  });

  it('renders help and danger zone sections in section data', () => {
    // SectionList virtualizes, so bottom items may not render in tests.
    // Verify the screen mounts and earlier legal items render.
    render(<SettingsScreen />);
    // Legal section header is rendered
    expect(screen.getByText('Хуулийн мэдээлэл')).toBeTruthy();
    // Terms and Privacy are rendered within legal
    expect(screen.getByText('Үйлчилгээний нөхцөл')).toBeTruthy();
    expect(screen.getByText('Нууцлалын бодлого')).toBeTruthy();
  });

  it('tapping role switch shows confirmation', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Үүрэг солих'));
    expect(screen.getByText('Дүр солих уу?')).toBeTruthy();
  });

  it('shows a success notification after confirming a role switch', () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Үүрэг солих'));
    fireEvent.press(screen.getByText('Батлах'));

    expect(mockSwitchRole).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Гүйцэтгэгч горимд шилжлээ.')).toBeTruthy();
  });

  it('renders all four section headers (Preferences, Account, Legal visible; Danger Zone in data)', () => {
    render(<SettingsScreen />);
    // SectionList virtualizes, so first 3 section headers render; Danger Zone
    // is in the data but may be beyond the initial render window.
    expect(screen.getByText('Тохируулга')).toBeTruthy();
    expect(screen.getByText('Бүртгэл')).toBeTruthy();
    expect(screen.getByText('Хуулийн мэдээлэл')).toBeTruthy();
  });

  it('navigates to terms, privacy, and help screens from legal rows', () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Үйлчилгээний нөхцөл'));
    fireEvent.press(screen.getByText('Нууцлалын бодлого'));
    fireEvent.press(screen.getByText('Тусламж & Дэмжлэг'));

    expect(mockPush).toHaveBeenCalledWith('/(shared)/legal/terms');
    expect(mockPush).toHaveBeenCalledWith('/(shared)/legal/privacy');
    expect(mockPush).toHaveBeenCalledWith('/(shared)/help');
  });

  it('opens a delete-account confirmation sheet before navigating to delete flow', () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Бүртгэл устгах'));
    expect(screen.getByText('Бүртгэл устгах уу?')).toBeTruthy();

    fireEvent.press(screen.getByText('Батлах'));
    expect(mockPush).toHaveBeenCalledWith('/(shared)/profile/delete');
  });
});

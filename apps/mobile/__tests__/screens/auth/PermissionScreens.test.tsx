import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import PermissionNotificationsScreen from '../../../src/app/(auth)/permission-notifications';
import { useAppStore } from '../../../src/store/appStore';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    mergeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    multiMerge: jest.fn(() => Promise.resolve()),
  },
}));

const mockRequestNotificationPermission = jest.fn().mockResolvedValue({ status: 'granted' });

jest.mock('../../../src/utils/permissions', () => ({
  requestNotificationPermission: () => mockRequestNotificationPermission(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockRequestNotificationPermission.mockResolvedValue({ status: 'granted' });
  useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
});

describe('Permission Notifications Screen (SCR-SHARED-009)', () => {
  it('renders notification permission copy from Figma', () => {
    render(<PermissionNotificationsScreen />);
    expect(screen.getByTestId('permission-notifications-primer')).toBeTruthy();
    expect(screen.getByText('Мэдэгдэл авах зөвшөөрөл')).toBeTruthy();
    expect(
      screen.getByText(
        'Шинэ өргөдөл, захиалгын мэдээллийг цаг тухайд нь авахын тулд мэдэгдлийг зөвшөөрнө үү',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Зөвшөөрөх')).toBeTruthy();
    expect(screen.getByText('Дараа хийх')).toBeTruthy();
  });

  it('renders Allow and Skip buttons', () => {
    render(<PermissionNotificationsScreen />);
    expect(screen.getByTestId('permission-allow-button')).toBeTruthy();
    expect(screen.getByTestId('permission-skip-button')).toBeTruthy();
  });

  it('Allow button triggers notification permission request', async () => {
    render(<PermissionNotificationsScreen />);
    fireEvent.press(screen.getByTestId('permission-allow-button'));
    expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1);
  });

  it('shows denied guidance when notification permission is rejected', async () => {
    mockRequestNotificationPermission.mockResolvedValue({ status: 'denied' });
    render(<PermissionNotificationsScreen />);
    fireEvent.press(screen.getByTestId('permission-allow-button'));
    expect(await screen.findByText('Мэдэгдлийн зөвшөөрөл хаагдсан')).toBeTruthy();
    expect(screen.getByText('Тохиргооноос мэдэгдлийг нээх боломжтой')).toBeTruthy();
    expect(screen.getByTestId('permission-continue-button')).toBeTruthy();
    expect(screen.getByText('Үргэлжлүүлэх')).toBeTruthy();
  });

  it('Skip routes customers into the my tasks landing screen', () => {
    render(<PermissionNotificationsScreen />);
    fireEvent.press(screen.getByTestId('permission-skip-button'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('final completion marks onboarding done before navigating the customer flow', () => {
    render(<PermissionNotificationsScreen />);
    fireEvent.press(screen.getByTestId('permission-skip-button'));
    expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('routes taskers into the task feed after the final primer', () => {
    useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'tasker' });

    render(<PermissionNotificationsScreen />);
    fireEvent.press(screen.getByTestId('permission-skip-button'));

    expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('granted notification access completes onboarding into the role-specific home', async () => {
    useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'tasker' });

    render(<PermissionNotificationsScreen />);
    fireEvent.press(screen.getByTestId('permission-allow-button'));

    expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('has a testID on the screen container', () => {
    render(<PermissionNotificationsScreen />);
    expect(screen.getByTestId('SCR-SHARED-009')).toBeTruthy();
  });
});

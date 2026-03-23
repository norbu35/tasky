import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAppStore } from '../../../src/store/appStore';

import RoleSelectScreen from '../../../src/app/(auth)/role-select';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

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

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
});

describe('RoleSelectScreen (SCR-SHARED-006)', () => {
  it('renders both role cards', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByTestId('role-card-customer')).toBeTruthy();
    expect(screen.getByTestId('role-card-tasker')).toBeTruthy();
  });

  it('renders customer card title and description', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByText('I need help')).toBeTruthy();
    expect(screen.getByText('Find verified Taskers for your jobs')).toBeTruthy();
  });

  it('renders tasker card title and description', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByText('I want to work')).toBeTruthy();
    expect(screen.getByText('Get matched with jobs near you')).toBeTruthy();
  });

  it('renders the heading', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByText('How will you use Tasky?')).toBeTruthy();
  });

  it('selecting customer sets role to customer and navigates', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-customer'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    expect(useAppStore.getState().currentRole).toBe('customer');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-camera');
  });

  it('selecting tasker sets role to tasker and navigates', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-tasker'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    expect(useAppStore.getState().currentRole).toBe('tasker');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-camera');
  });

  it('confirm button is disabled until a role is selected', () => {
    render(<RoleSelectScreen />);
    const btn = screen.getByTestId('role-confirm-button');
    expect(btn).toBeDisabled();
  });

  it('has a testID on the screen container', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByTestId('role-select-screen')).toBeTruthy();
  });
});

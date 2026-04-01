import React from 'react';
import { StyleSheet } from 'react-native';
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

  it('renders the Figma heading and subtitle', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByText(/Та юу хийхийг хүсч байна/i)).toBeTruthy();
    expect(screen.getByText('Та хүссэн үедээ роль солих боломжтой')).toBeTruthy();
  });

  it('renders customer and tasker cards from Figma', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByText('Захиалагч')).toBeTruthy();
    expect(screen.getByText('Даалгавар оруулж, гүйцэтгэгч олох')).toBeTruthy();
    expect(screen.getByText('Гүйцэтгэгч')).toBeTruthy();
    expect(screen.getByText('Даалгавар хүлээж аваад орлого олох')).toBeTruthy();
  });

  it('selecting customer opens a confirmation sheet before navigation', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-customer'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    expect(screen.getByText('Та итгэлтэй байна уу?')).toBeTruthy();
    expect(
      screen.getByText('Захиалагч болохоо баталгаажуулна уу. Тохиргооноос дараа солих боломжтой.'),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('confirming customer selection sets role and navigates', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-customer'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    fireEvent.press(screen.getByTestId('role-sheet-confirm'));
    expect(useAppStore.getState().currentRole).toBe('customer');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-camera');
  });

  it('confirming tasker selection sets role and navigates', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-tasker'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    fireEvent.press(screen.getByTestId('role-sheet-confirm'));
    expect(useAppStore.getState().currentRole).toBe('tasker');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-camera');
  });

  it('go back closes the confirmation sheet without navigating', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-tasker'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    fireEvent.press(screen.getByTestId('role-sheet-cancel'));
    expect(screen.queryByText('Та итгэлтэй байна уу?')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('confirm button is disabled until a role is selected', () => {
    render(<RoleSelectScreen />);
    const btn = screen.getByTestId('role-confirm-button');
    expect(btn).toBeDisabled();
  });

  it('keeps the selected card light with a navy border and a corner check', () => {
    render(<RoleSelectScreen />);

    fireEvent.press(screen.getByTestId('role-card-customer'));

    const selectedCard = StyleSheet.flatten(screen.getByTestId('role-card-customer').props.style);
    const unselectedCard = StyleSheet.flatten(screen.getByTestId('role-card-tasker').props.style);

    expect(selectedCard.backgroundColor).toBe('#ffffff');
    expect(String(selectedCard.borderColor).toLowerCase()).toBe('#1b3a5c');
    expect(unselectedCard.backgroundColor).toBe('#f4f3f0');
    expect(screen.getByTestId('role-card-customer-check')).toBeTruthy();
  });

  it('renders a real mood image instead of an empty placeholder', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByTestId('role-mood-image').props.source.uri).toContain('figma');
  });

  it('has a testID on the screen container', () => {
    render(<RoleSelectScreen />);
    expect(screen.getByTestId('role-select-screen')).toBeTruthy();
  });
});

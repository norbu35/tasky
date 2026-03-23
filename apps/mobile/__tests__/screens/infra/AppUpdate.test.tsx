import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AppUpdateScreen from '../../../src/app/(shared)/app-update';

import { openURL as mockOpenURL } from 'expo-linking';

jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: {
      View: RN.View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withSpring: (v: number) => v,
    Easing: { bezier: () => (t: number) => t },
  };
});

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('expo-linking', () => ({
  __esModule: true,
  openURL: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

describe('AppUpdateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('renders soft update title and body by default', () => {
    render(<AppUpdateScreen />);

    expect(screen.getByText('Update Available')).toBeTruthy();
    expect(screen.getByText('A new version is available')).toBeTruthy();
  });

  it('shows dismiss button for soft update', () => {
    render(<AppUpdateScreen />);

    expect(screen.getByText('Not Now')).toBeTruthy();
    expect(screen.getByText('Update')).toBeTruthy();
  });

  it('force update hides dismiss button', () => {
    mockParams = { type: 'force' };

    render(<AppUpdateScreen />);

    expect(screen.getByText('Update Required')).toBeTruthy();
    expect(screen.getByText('Update Now')).toBeTruthy();
    expect(screen.queryByText('Not Now')).toBeFalsy();
  });

  it('update button opens store link', () => {
    render(<AppUpdateScreen />);

    fireEvent.press(screen.getByText('Update'));
    expect(mockOpenURL).toHaveBeenCalled();
  });

  it('has correct testID on root container', () => {
    render(<AppUpdateScreen />);

    expect(screen.getByTestId('app-update-screen')).toBeTruthy();
  });
});

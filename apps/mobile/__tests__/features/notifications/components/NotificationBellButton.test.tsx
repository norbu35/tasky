import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    Bell: (props: React.ComponentProps<typeof Text>) => <Text testID="icon-Bell" {...props} />,
  };
});

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
  jest.clearAllMocks();
});

describe('NotificationBellButton', () => {
  it('TID-MOBILE-NOTIFICATIONS-BELL opens the shared notifications route', () => {
    render(<NotificationBellButton testID="notifications-button" />);

    const button = screen.getByTestId('notifications-button');
    fireEvent.press(button);

    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Notifications');
    expect(mockPush).toHaveBeenCalledWith('/(shared)/notifications');
  });
});

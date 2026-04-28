import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { InboxHeader } from '@/features/chat/screens/Inbox.Header';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: React.ComponentProps<typeof Text>) => (
        <Text testID={`icon-${String(name)}`} {...props} />
      ),
    },
  );
});

function renderHeader(overrides: Partial<React.ComponentProps<typeof InboxHeader>> = {}) {
  const props: React.ComponentProps<typeof InboxHeader> = {
    activeFilter: 'all',
    isSearchVisible: false,
    search: '',
    onOpenSettings: jest.fn(),
    onSearchChange: jest.fn(),
    onSelectFilter: jest.fn(),
    onToggleSearch: jest.fn(),
    ...overrides,
  };

  render(<InboxHeader {...props} />);
  return props;
}

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
  jest.clearAllMocks();
});

describe('InboxHeader', () => {
  it('TID-MOBILE-INBOX-HEADER renders filters and dispatches header actions', () => {
    const props = renderHeader({ activeFilter: 'unread' });

    fireEvent.press(screen.getByTestId('conversation-search-toggle'));
    fireEvent.press(screen.getByTestId('conversation-settings'));
    fireEvent.press(screen.getByTestId('conversation-filter-bookings'));

    expect(screen.getByText('Messages')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Unread')).toBeTruthy();
    expect(screen.getByText('Bookings')).toBeTruthy();
    expect(screen.getByTestId('conversation-filter-unread').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(props.onToggleSearch).toHaveBeenCalledTimes(1);
    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    expect(props.onSelectFilter).toHaveBeenCalledWith('bookings');
  });

  it('TID-MOBILE-INBOX-HEADER keeps search visible while text is present', () => {
    const props = renderHeader({ search: 'paint' });

    fireEvent.changeText(screen.getByTestId('conversation-search-input'), 'cleaning');

    expect(props.onSearchChange).toHaveBeenCalledWith('cleaning');
  });
});

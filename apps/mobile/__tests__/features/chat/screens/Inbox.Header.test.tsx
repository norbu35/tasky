import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { InboxHeader } from '@/features/chat/screens/Inbox.Header';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

function renderHeader(overrides: Partial<React.ComponentProps<typeof InboxHeader>> = {}) {
  const props: React.ComponentProps<typeof InboxHeader> = {
    activeFilter: 'all',
    onSelectFilter: jest.fn(),
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
  it('TID-MOBILE-INBOX-HEADER renders filters and dispatches filter selection', () => {
    const props = renderHeader({ activeFilter: 'unread' });

    fireEvent.press(screen.getByTestId('conversation-filter-bookings'));

    expect(screen.getByText('Messages')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Unread')).toBeTruthy();
    expect(screen.getByText('Bookings')).toBeTruthy();
    expect(screen.getByTestId('conversation-filter-unread').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(props.onSelectFilter).toHaveBeenCalledWith('bookings');
  });
});

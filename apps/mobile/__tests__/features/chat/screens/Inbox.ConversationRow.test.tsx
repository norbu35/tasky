import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ConversationRow } from '@/features/chat/screens/Inbox.ConversationRow';
import type { ConversationItem } from '@/features/chat/screens/Inbox.model';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

const conversation: ConversationItem = {
  id: 'conversation-1',
  task_id: 'task-1',
  task_title: 'Apartment cleaning',
  counterparty_id: 'tasker-1',
  counterparty_name: 'Temuulen Bold',
  counterparty_avatar_url: null,
  counterparty_last_active_at: null,
  last_message_content: 'I can arrive at 10:00.',
  last_message_at: '2026-04-29T02:00:00.000Z',
  unread_count: 2,
  created_at: '2026-04-29T01:00:00.000Z',
};

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
  jest.clearAllMocks();
});

describe('ConversationRow', () => {
  it('TID-MOBILE-INBOX-ROW renders conversation context and unread state', () => {
    render(<ConversationRow item={conversation} onPress={jest.fn()} timestamp="10:00" />);

    expect(screen.getByText('Temuulen Bold')).toBeTruthy();
    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.getByText('I can arrive at 10:00.')).toBeTruthy();
    expect(screen.getByText('Apartment cleaning · Confirmed')).toBeTruthy();
    expect(screen.getByTestId('conversation-row-conversation-1-unread')).toBeTruthy();
  });

  it('TID-MOBILE-INBOX-ROW uses the task discussion fallback and handles presses', () => {
    const onPress = jest.fn();
    render(
      <ConversationRow
        item={{
          ...conversation,
          counterparty_name: 'Anonymous Tasker',
          last_message_content: null,
          task_title: null,
          unread_count: 0,
        }}
        onPress={onPress}
        timestamp=""
      />,
    );

    fireEvent.press(screen.getByTestId('conversation-row-conversation-1'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Task Discussion').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.queryByTestId('conversation-row-conversation-1-unread')).toBeNull();
  });
});

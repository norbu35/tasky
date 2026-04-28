import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useConversationRouteForBooking } from '../../../../src/features/chat/hooks/useConversationRouteForBooking';
import { useConversations } from '../../../../src/features/chat/hooks/useConversations';

jest.mock('../../../../src/features/chat/hooks/useConversations', () => ({
  useConversations: jest.fn(),
}));

const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;

function ConversationRouteProbe({
  taskId,
  counterpartyId,
}: {
  taskId?: string | null;
  counterpartyId?: string | null;
}) {
  const result = useConversationRouteForBooking({ taskId, counterpartyId });
  return (
    <>
      <Text testID="conversation-id">{result.conversationId ?? 'none'}</Text>
      <Text testID="conversation-route">{result.route}</Text>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseConversations.mockReturnValue({
    data: {
      data: [
        {
          id: 'conversation-other-task',
          task_id: 'task-other',
          task_title: 'Other task',
          counterparty_id: 'customer-1',
          counterparty_name: 'Customer One',
          counterparty_avatar_url: null,
          counterparty_last_active_at: null,
          last_message_content: null,
          last_message_at: null,
          unread_count: 0,
          created_at: '2026-04-20T00:00:00Z',
        },
        {
          id: 'conversation-target',
          task_id: 'task-1',
          task_title: 'Deep cleaning',
          counterparty_id: 'customer-1',
          counterparty_name: 'Customer One',
          counterparty_avatar_url: null,
          counterparty_last_active_at: null,
          last_message_content: 'See you there',
          last_message_at: '2026-04-22T00:00:00Z',
          unread_count: 1,
          created_at: '2026-04-20T00:00:00Z',
        },
      ],
      cursor: { next: null, prev: null },
    },
  } as unknown as ReturnType<typeof useConversations>);
});

describe('useConversationRouteForBooking', () => {
  it('routes to the booking conversation matching task and counterparty', () => {
    render(<ConversationRouteProbe taskId="task-1" counterpartyId="customer-1" />);

    expect(screen.getByTestId('conversation-id').props.children).toBe('conversation-target');
    expect(screen.getByTestId('conversation-route').props.children).toBe(
      '/inbox/conversation-target',
    );
  });

  it('falls back to the inbox when no matching conversation exists', () => {
    render(<ConversationRouteProbe taskId="task-1" counterpartyId="customer-2" />);

    expect(screen.getByTestId('conversation-id').props.children).toBe('none');
    expect(screen.getByTestId('conversation-route').props.children).toBe('/inbox');
  });

  it('does not search for a conversation until both identifiers are present', () => {
    render(<ConversationRouteProbe taskId="task-1" counterpartyId={null} />);

    expect(screen.getByTestId('conversation-id').props.children).toBe('none');
    expect(screen.getByTestId('conversation-route').props.children).toBe('/inbox');
  });
});

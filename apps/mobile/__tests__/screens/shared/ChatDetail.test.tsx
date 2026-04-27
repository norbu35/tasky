import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import type { TextProps } from 'react-native';

import ChatDetailScreen from '../../../src/app/(tabs)/inbox/[id]';
import { useMessages } from '../../../src/features/chat/hooks/useMessages';
import { useSendMessage } from '../../../src/features/chat/hooks/useSendMessage';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ id: 'conv-123' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = jest.requireActual(
    '../../test-utils/mockI18n',
  ) as typeof import('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = jest.requireActual('react-native') as typeof import('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = jest.requireActual('react-native') as typeof import('react-native');
  return new Proxy(
    {},
    {
      get: (_target: unknown, name: string) =>
        function MockIcon(props: TextProps) {
          return <Text testID={`icon-${String(name)}`} {...props} />;
        },
    },
  );
});

jest.mock('../../../src/features/chat/hooks/useMessages', () => ({
  useMessages: jest.fn(),
}));

jest.mock('../../../src/features/chat/hooks/useSendMessage', () => ({
  useSendMessage: jest.fn(),
}));

jest.mock('../../../src/features/chat/hooks/useConversations', () => ({
  useConversations: () => ({
    data: {
      data: [
        {
          id: 'conv-123',
          task_id: 'task-1',
          task_title: 'Test task',
          counterparty_id: 'user-2',
          counterparty_name: 'Test User',
          counterparty_avatar_url: null,
          counterparty_last_active_at: null,
          last_message_content: 'Hello',
          last_message_at: null,
          unread_count: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

type AuthStoreState = {
  session: {
    accessToken: string;
  };
};

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: (selector: (state: AuthStoreState) => unknown) =>
    selector({
      session: { accessToken: 'test-token' },
    }),
}));

jest.mock('../../../src/features/profile/hooks/useProfile', () => ({
  useMyUserId: () => 'user-me',
  useMyProfile: () => ({ data: { id: 'user-me' }, isLoading: false }),
}));

const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;

const mockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockUseSendMessage.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useSendMessage>);
});

describe('ChatDetailScreen (SCR-SHARED-011)', () => {
  it('renders transport messages chronologically by sent timestamp', () => {
    mockUseMessages.mockReturnValue({
      data: {
        data: [
          {
            id: 'msg-latest',
            content: 'Latest message',
            sender_id: 'user-me',
            sent_at: '2026-03-23T09:02:00Z',
          },
          {
            id: 'msg-earliest',
            content: 'Earliest message',
            sender_id: 'user-other',
            sent_at: '2026-03-23T09:00:00Z',
          },
          {
            id: 'msg-middle',
            content: 'Middle message',
            sender_id: 'user-other',
            sent_at: '2026-03-23T09:01:00Z',
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    const view = render(<ChatDetailScreen />);
    const serialized = JSON.stringify(view.toJSON());

    expect(serialized.indexOf('Earliest message')).toBeLessThan(
      serialized.indexOf('Middle message'),
    );
    expect(serialized.indexOf('Middle message')).toBeLessThan(serialized.indexOf('Latest message'));
  });

  it('renders messages in the conversation', () => {
    mockUseMessages.mockReturnValue({
      data: {
        data: [
          {
            id: 'msg-1',
            content: 'Hello there',
            sender_id: 'user-other',
            sent_at: '2026-03-23T09:00:00Z',
          },
          {
            id: 'msg-2',
            content: 'Hi! How can I help?',
            sender_id: 'user-me',
            sent_at: '2026-03-23T09:01:00Z',
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    expect(screen.getByText('Hello there')).toBeTruthy();
    expect(screen.getByText('Hi! How can I help?')).toBeTruthy();
  });

  it('applies sent bubble styling for own messages', () => {
    mockUseMessages.mockReturnValue({
      data: {
        data: [
          {
            id: 'msg-1',
            content: 'My message',
            sender_id: 'user-me',
            sent_at: '2026-03-23T09:00:00Z',
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    const bubble = screen.getByTestId('message-bubble-msg-1');
    expect(bubble).toBeTruthy();
    expect(screen.getByTestId('message-sent-msg-1')).toBeTruthy();
  });

  it('applies received bubble styling for other messages', () => {
    mockUseMessages.mockReturnValue({
      data: {
        data: [
          {
            id: 'msg-1',
            content: 'Their message',
            sender_id: 'user-other',
            sent_at: '2026-03-23T09:00:00Z',
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    expect(screen.getByTestId('message-received-msg-1')).toBeTruthy();
  });

  it('input field accepts text', () => {
    mockUseMessages.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    const input = screen.getByTestId('chat-input');
    fireEvent.changeText(input, 'Hello world');
    expect(input.props.value).toBe('Hello world');
  });

  it('send button calls sendMessage with correct params', () => {
    mockUseMessages.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    const input = screen.getByTestId('chat-input');
    fireEvent.changeText(input, 'Test message');
    fireEvent.press(screen.getByTestId('chat-send-button'));

    expect(mockMutate).toHaveBeenCalledWith({
      conversationId: 'conv-123',
      content: 'Test message',
    });
  });

  it('shows timestamps for messages', () => {
    mockUseMessages.mockReturnValue({
      data: {
        data: [
          {
            id: 'msg-1',
            content: 'Hello there',
            sender_id: 'user-other',
            sent_at: '2026-03-23T09:00:00Z',
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    expect(screen.getByTestId('message-timestamp-msg-1')).toBeTruthy();
  });

  it('shows error state and retries loading messages', () => {
    const refetch = jest.fn();
    mockUseMessages.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    expect(screen.getByText('Мессежүүдийг ачаалж чадсангүй')).toBeTruthy();
    fireEvent.press(screen.getByTestId('chat-detail-error-retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows phone number warning when phone pattern is detected', () => {
    mockUseMessages.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMessages>);
    render(<ChatDetailScreen />);

    const input = screen.getByTestId('chat-input');
    fireEvent.changeText(input, 'Call me at 99112233');

    expect(screen.getByTestId('phone-warning')).toBeTruthy();
  });
});

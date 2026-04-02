import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useConversations } from '../../../src/features/chat/hooks/useConversations';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const fb = typeof fallback === 'string' ? fallback : key;
      return fb;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

jest.mock('../../../src/features/chat/hooks/useConversations', () => ({
  useConversations: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConversationListScreen (SCR-SHARED-010)', () => {
  it('renders loading skeleton when isLoading is true', () => {
    mockUseConversations.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useConversations>);

    const ConversationListScreen = require('../../../src/app/(tabs)/inbox/index').default;
    render(<ConversationListScreen />);

    expect(screen.getByTestId('conversation-list')).toBeTruthy();
  });

  it('shows empty state when no conversations exist', () => {
    mockUseConversations.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useConversations>);

    const ConversationListScreen = require('../../../src/app/(tabs)/inbox/index').default;
    render(<ConversationListScreen />);

    expect(screen.getByText('Мессеж байхгүй')).toBeTruthy();
  });

  it('renders conversation rows with name, preview, and timestamp', () => {
    mockUseConversations.mockReturnValue({
      data: {
        data: [
          {
            id: 'conv-1',
            task_title: 'Apartment Cleaning',
            last_message_preview: 'See you tomorrow!',
            last_message_at: '2026-03-23T10:00:00Z',
            counterparty_name: 'John Doe',
            counterparty_avatar_url: null,
            unread_count: 2,
          },
          {
            id: 'conv-2',
            task_title: 'Plumbing Fix',
            last_message_preview: 'Thanks for the update',
            last_message_at: '2026-03-22T08:00:00Z',
            counterparty_name: 'Jane Smith',
            counterparty_avatar_url: null,
            unread_count: 0,
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useConversations>);

    const ConversationListScreen = require('../../../src/app/(tabs)/inbox/index').default;
    render(<ConversationListScreen />);

    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('See you tomorrow!')).toBeTruthy();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
    expect(screen.getByText('Thanks for the update')).toBeTruthy();
  });

  it('navigates to chat detail on conversation press', () => {
    mockUseConversations.mockReturnValue({
      data: {
        data: [
          {
            id: 'conv-1',
            task_title: 'Apartment Cleaning',
            last_message_preview: 'See you tomorrow!',
            last_message_at: '2026-03-23T10:00:00Z',
            counterparty_name: 'John Doe',
            counterparty_avatar_url: null,
            unread_count: 0,
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useConversations>);

    const ConversationListScreen = require('../../../src/app/(tabs)/inbox/index').default;
    render(<ConversationListScreen />);

    fireEvent.press(screen.getByTestId('conversation-row-conv-1'));
    expect(mockPush).toHaveBeenCalledWith('/inbox/conv-1');
  });

  it('renders the inbox title and filters conversations by counterparty name', () => {
    mockUseConversations.mockReturnValue({
      data: {
        data: [
          {
            id: 'conv-1',
            task_title: 'Apartment Cleaning',
            last_message_preview: 'See you tomorrow!',
            last_message_at: '2026-03-23T10:00:00Z',
            counterparty_name: 'John Doe',
            counterparty_avatar_url: null,
            unread_count: 0,
          },
          {
            id: 'conv-2',
            task_title: 'Plumbing Fix',
            last_message_preview: 'Thanks for the update',
            last_message_at: '2026-03-22T08:00:00Z',
            counterparty_name: 'Jane Smith',
            counterparty_avatar_url: null,
            unread_count: 0,
          },
        ],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useConversations>);

    const ConversationListScreen = require('../../../src/app/(tabs)/inbox/index').default;
    render(<ConversationListScreen />);

    expect(screen.getByText('Мессеж')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Хайх...'), 'Jane');

    expect(screen.queryByText('John Doe')).toBeNull();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });

  it('shows the inbox error state and retries loading', () => {
    const refetch = jest.fn();
    mockUseConversations.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isRefetching: false,
      refetch,
    } as unknown as ReturnType<typeof useConversations>);

    const ConversationListScreen = require('../../../src/app/(tabs)/inbox/index').default;
    render(<ConversationListScreen />);

    expect(screen.getByText('Мессежүүдийг ачаалж чадсангүй')).toBeTruthy();
    fireEvent.press(screen.getByText('Дахин оролдох'));
    expect(refetch).toHaveBeenCalled();
  });
});

import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react-native';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const render = (ui: React.ReactElement, options?: any) =>
  rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);

import { resetTestI18n, setTestLanguage } from '../test-utils/mockI18n';
import { baseTask, baseBooking, resetStores } from './fixtures';
import { useAppStore } from '../../src/store/appStore';
import { useTasks } from '../../src/features/tasks/hooks/useTasks';
import { useBookings } from '../../src/features/bookings/hooks/useBookings';
import { RoleProvider } from '../../src/providers/RoleProvider';
import FeedScreen from '../../src/app/(tabs)/index';
import BookingsScreen from '../../src/app/(tabs)/bookings';

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  function TabsMock({ children }: { children?: React.ReactNode }) {
    return <View testID="tabs-layout">{children}</View>;
  }
  function TabsScreenMock({
    name,
    options,
  }: {
    name: string;
    options?: { title?: string; href?: null };
  }) {
    return <Text testID={`tab-${name}`}>{options?.title ?? name}</Text>;
  }
  TabsMock.Screen = TabsScreenMock;
  function StackMock({ children }: { children?: React.ReactNode }) {
    return <View testID="stack-layout">{children}</View>;
  }
  function StackScreenMock({ name }: { name: string }) {
    return <Text testID={`stack-${name}`}>{name}</Text>;
  }
  StackMock.Screen = StackScreenMock;
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    Stack: StackMock,
    Tabs: TabsMock,
    router: { replace: jest.fn(), push: jest.fn() },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  };
});

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../test-utils/mockI18n');
  return createReactI18nextMock('en');
});
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
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
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../../src/features/tasks/hooks/useTasks', () => ({
  useTasks: jest.fn(),
}));
jest.mock('../../src/features/bookings/hooks/useBookings', () => ({
  useBookings: jest.fn(),
}));

const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;
const mockUseBookings = useBookings as jest.MockedFunction<typeof useBookings>;

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
  resetTestI18n();
  setTestLanguage('en');
});

describe('Customer journey integration', () => {
  describe('Task feed', () => {
    beforeEach(() => {
      useAppStore.setState({ currentRole: 'tasker' });
    });

    it('renders tasks from hook', () => {
      mockUseTasks.mockReturnValue({
        data: {
          data: [baseTask],
          cursor: { next: null, prev: null },
        },
        isLoading: false,
        isError: false,
        isRefetching: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTasks>);

      render(
        <RoleProvider>
          <FeedScreen />
        </RoleProvider>,
      );

      expect(screen.getByText('Window cleaning')).toBeTruthy();
      expect(screen.getByText(/Сүхбаатар дүүрэг/)).toBeTruthy();
      expect(screen.getByTestId('task-card-public-task-1')).toBeTruthy();
    });

    it('shows empty state when no tasks', () => {
      mockUseTasks.mockReturnValue({
        data: {
          data: [],
          cursor: { next: null, prev: null },
        },
        isLoading: false,
        isError: false,
        isRefetching: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTasks>);

      render(
        <RoleProvider>
          <FeedScreen />
        </RoleProvider>,
      );

      expect(screen.getByTestId('task-feed-empty')).toBeTruthy();
      expect(screen.queryByTestId('task-card-public-task-1')).toBeNull();
    });

    it('shows loading state', () => {
      mockUseTasks.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isRefetching: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTasks>);

      render(
        <RoleProvider>
          <FeedScreen />
        </RoleProvider>,
      );

      expect(screen.getByTestId('task-feed')).toBeTruthy();
      // Loading state renders skeleton cards, no task cards
      expect(screen.queryByTestId('task-card-public-task-1')).toBeNull();
    });

    it('shows error state', () => {
      mockUseTasks.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isRefetching: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTasks>);

      render(
        <RoleProvider>
          <FeedScreen />
        </RoleProvider>,
      );

      expect(screen.getByTestId('task-feed-error')).toBeTruthy();
    });
  });

  describe('Bookings list', () => {
    beforeEach(() => {
      useAppStore.setState({ currentRole: 'customer' });
    });

    it('renders bookings', () => {
      mockUseBookings.mockReturnValue({
        data: {
          data: [baseBooking],
          cursor: { next: null, prev: null },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof useBookings>);

      render(
        <RoleProvider>
          <BookingsScreen />
        </RoleProvider>,
      );

      expect(screen.getByText('ASSIGNED')).toBeTruthy();
    });

    it('shows empty state when no bookings', () => {
      mockUseBookings.mockReturnValue({
        data: {
          data: [],
          cursor: { next: null, prev: null },
        },
        isLoading: false,
      } as unknown as ReturnType<typeof useBookings>);

      render(
        <RoleProvider>
          <BookingsScreen />
        </RoleProvider>,
      );

      expect(screen.getByText('No bookings yet')).toBeTruthy();
      expect(screen.getByText('Post a task and select a Tasker to get started')).toBeTruthy();
    });
  });
});

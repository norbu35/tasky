import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen } from '@testing-library/react-native';
import React from 'react';

import TabsLayout from '../../src/app/(tabs)/_layout';
import HomeTab from '../../src/app/(tabs)/index';
import MyProfileScreen from '../../src/app/(tabs)/profile';
import { useMyProfile } from '../../src/features/profile/hooks/useProfile';
import { useMyTasks } from '../../src/features/tasks/hooks/useMyTasks';
import { useTasks } from '../../src/features/tasks/hooks/useTasks';
import { RoleProvider } from '../../src/providers/RoleProvider';
import { useAppStore } from '../../src/store/appStore';
import { resetTestI18n, setTestLanguage } from '../test-utils/mockI18n';

import {
  baseTask,
  repairTask,
  taskerSession,
  taskerProfile,
  resetStores,
  setAuthenticated,
} from './fixtures';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const render = (ui: React.ReactElement, options?: any) =>
  rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);

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
    useSegments: jest.fn().mockReturnValue([]),
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
jest.mock('../../src/features/tasks/hooks/useMyTasks', () => ({
  useMyTasks: jest.fn(),
}));
jest.mock('../../src/features/profile/hooks/useProfile', () => ({
  useMyProfile: jest.fn(),
  useUpdateProfile: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
  useSignOut: jest.fn(() => jest.fn()),
}));

const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;
const mockUseMyTasks = useMyTasks as jest.MockedFunction<typeof useMyTasks>;
const mockUseMyProfile = useMyProfile as jest.MockedFunction<typeof useMyProfile>;

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
  resetTestI18n();
  setTestLanguage('en');
  useAppStore.setState({ currentRole: 'tasker' });
  mockUseMyTasks.mockReturnValue({
    data: { data: [] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useMyTasks>);
});

describe('Tasker journey integration', () => {
  describe('Tasker task feed', () => {
    it('tasker sees task feed with tasks', () => {
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
          <HomeTab />
        </RoleProvider>,
      );

      expect(screen.getByText('Window cleaning')).toBeTruthy();
      expect(screen.getByTestId('task-card-public-task-1')).toBeTruthy();
    });

    it('tasker task feed shows multiple tasks', () => {
      mockUseTasks.mockReturnValue({
        data: {
          data: [baseTask, repairTask],
          cursor: { next: null, prev: null },
        },
        isLoading: false,
        isError: false,
        isRefetching: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useTasks>);

      render(
        <RoleProvider>
          <HomeTab />
        </RoleProvider>,
      );

      expect(screen.getByText('Window cleaning')).toBeTruthy();
      expect(screen.getByText('Fix broken pipe')).toBeTruthy();
      expect(screen.getByTestId('task-card-public-task-1')).toBeTruthy();
      expect(screen.getByTestId('task-card-public-task-2')).toBeTruthy();
    });
  });

  describe('Tasker tabs', () => {
    it('tasker tabs show correct labels', () => {
      render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );

      expect(screen.getByTestId('tab-index')).toHaveTextContent('Browse');
      expect(screen.getByTestId('tab-bookings')).toHaveTextContent('My Jobs');
    });
  });

  describe('Tasker profile', () => {
    it('tasker profile shows verified badge content', () => {
      setAuthenticated(taskerSession);
      useAppStore.setState({ currentRole: 'tasker' });

      mockUseMyProfile.mockReturnValue({
        data: taskerProfile,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useMyProfile>);

      render(
        <RoleProvider>
          <MyProfileScreen />
        </RoleProvider>,
      );

      expect(screen.getByText('Test Tasker')).toBeTruthy();
    });
  });
});

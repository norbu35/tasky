import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import {
  NotificationProvider,
  useNotificationContext,
} from '../../src/providers/NotificationProvider';
import { RoleProvider, useRole } from '../../src/providers/RoleProvider';
import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';
import { createTestQueryClient } from '../test-utils/queryClient';

import { baseSession, resetStores } from './fixtures';

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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
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

jest.mock('../../src/lib/notifications', () => ({
  registerForPushNotificationsAsync: jest.fn(() => Promise.resolve({ token: null, error: null })),
}));
jest.mock('expo-constants', () => ({
  executionEnvironment: 'storeClient',
}));
jest.mock('@react-native-firebase/messaging', () => ({
  default: jest.fn(() => ({
    setBackgroundMessageHandler: jest.fn(),
    onMessage: jest.fn(),
  })),
}));
jest.mock('@notifee/react-native', () => ({
  default: { displayNotification: jest.fn() },
}));
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return { GestureHandlerRootView: View };
});

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
});

describe('provider-chain', () => {
  it('QueryClient + RoleProvider compose correctly', () => {
    const queryClient = createTestQueryClient();

    function RoleConsumer() {
      const { currentRole, isCustomer } = useRole();
      return (
        <>
          <Text testID="role">{currentRole}</Text>
          <Text testID="is-customer">{String(isCustomer)}</Text>
        </>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <RoleProvider>
          <RoleConsumer />
        </RoleProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('role')).toHaveTextContent('customer');
    expect(screen.getByTestId('is-customer')).toHaveTextContent('true');

    queryClient.clear();
  });

  it('NotificationProvider provides context with default null values', () => {
    function NotificationConsumer() {
      const { pushToken, error } = useNotificationContext();
      return (
        <>
          <Text testID="push-token">{pushToken ?? 'null'}</Text>
          <Text testID="error">{error ?? 'null'}</Text>
        </>
      );
    }

    render(
      <NotificationProvider>
        <NotificationConsumer />
      </NotificationProvider>,
    );

    expect(screen.getByTestId('push-token')).toHaveTextContent('null');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('auth store state flows through to consuming components', () => {
    useAuthStore.setState({ session: baseSession });

    function SessionConsumer() {
      const session = useAuthStore((s) => s.session);
      return <Text testID="access-token">{session?.accessToken ?? 'none'}</Text>;
    }

    render(<SessionConsumer />);

    expect(screen.getByTestId('access-token')).toHaveTextContent('access-token');
  });

  it('app store state flows through RoleProvider', () => {
    useAppStore.setState({ currentRole: 'tasker' });

    function RoleConsumer() {
      const { isTasker, isCustomer } = useRole();
      return (
        <>
          <Text testID="is-tasker">{String(isTasker)}</Text>
          <Text testID="is-customer">{String(isCustomer)}</Text>
        </>
      );
    }

    render(
      <RoleProvider>
        <RoleConsumer />
      </RoleProvider>,
    );

    expect(screen.getByTestId('is-tasker')).toHaveTextContent('true');
    expect(screen.getByTestId('is-customer')).toHaveTextContent('false');
  });

  it('signOut clears auth state', () => {
    useAuthStore.setState({
      session: baseSession,
    });

    // Verify state is set
    expect(useAuthStore.getState().session).toEqual(baseSession);

    // Call signOut
    useAuthStore.getState().signOut();

    // Verify state is cleared
    expect(useAuthStore.getState().session).toBeNull();
  });
});

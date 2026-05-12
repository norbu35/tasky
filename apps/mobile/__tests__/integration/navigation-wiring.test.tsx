import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen } from '@testing-library/react-native';
import React from 'react';

import AuthLayout from '../../src/app/(auth)/_layout';
import CustomerLayout from '../../src/app/(customer)/_layout';
import SharedLayout from '../../src/app/(shared)/_layout';
import TabsLayout from '../../src/app/(tabs)/_layout';
import TaskerLayout from '../../src/app/(tasker)/_layout';
import { RoleProvider } from '../../src/providers/RoleProvider';
import { useAppStore } from '../../src/store/appStore';
import { resetTestI18n, setTestLanguage } from '../test-utils/mockI18n';

import { resetStores } from './fixtures';
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
  function StackScreenMock({
    name,
    options,
  }: {
    name: string;
    options?: { headerShown?: boolean };
  }) {
    return (
      <Text testID={`stack-${name}`}>{`${name} headerShown:${String(options?.headerShown)}`}</Text>
    );
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

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
  resetTestI18n();
  setTestLanguage('en');
});

describe('navigation-wiring', () => {
  it('auth layout declares all expected screens', () => {
    render(<AuthLayout />);

    expect(screen.getByTestId('stack-layout')).toBeTruthy();
    expect(screen.getByTestId('stack-index')).toBeTruthy();
    expect(screen.getByTestId('stack-role-select')).toBeTruthy();
    expect(screen.getByTestId('stack-permission-notifications')).toBeTruthy();
  });

  it('tabs layout declares correct tab screens', () => {
    useAppStore.setState({ currentRole: 'customer' });

    render(
      <RoleProvider>
        <TabsLayout />
      </RoleProvider>,
    );

    expect(screen.getByTestId('tabs-layout')).toBeTruthy();
    expect(screen.getByTestId('tab-index')).toBeTruthy();
    expect(screen.getByTestId('tab-bookings')).toBeTruthy();
    expect(screen.getByTestId('tab-inbox')).toBeTruthy();
    expect(screen.getByTestId('tab-profile')).toBeTruthy();
    expect(screen.getByTestId('global-fab')).toBeTruthy();

    // Customer role tab titles
    expect(screen.getByTestId('tab-index')).toHaveTextContent('My Tasks');
    expect(screen.getByTestId('tab-bookings')).toHaveTextContent('Bookings');
    expect(screen.getByTestId('tab-inbox')).toHaveTextContent('Inbox');
    expect(screen.getByTestId('tab-profile')).toHaveTextContent('Profile');
  });

  it('tabs layout uses role-aware titles for tasker', () => {
    useAppStore.setState({ currentRole: 'tasker' });

    render(
      <RoleProvider>
        <TabsLayout />
      </RoleProvider>,
    );

    expect(screen.getByTestId('tab-index')).toHaveTextContent('Browse');
    expect(screen.getByTestId('tab-bookings')).toHaveTextContent('My Jobs');
    expect(screen.queryByTestId('global-fab')).toBeNull();
  });

  it('customer layout renders as stack', () => {
    render(<CustomerLayout />);

    expect(screen.getByTestId('stack-layout')).toBeTruthy();
  });

  it('tasker layout renders as stack', () => {
    render(<TaskerLayout />);

    expect(screen.getByTestId('stack-layout')).toBeTruthy();
  });

  it('shared layout renders as stack', () => {
    render(<SharedLayout />);

    expect(screen.getByTestId('stack-layout')).toBeTruthy();
  });

  it('shared review screen owns its header inside the screen body', () => {
    render(<SharedLayout />);

    expect(screen.getByTestId('stack-review/[bookingId]')).toHaveTextContent(/headerShown:false/);
  });
});

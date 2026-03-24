import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAppStore } from '../../src/store/appStore';
import { RoleProvider } from '../../src/providers/RoleProvider';
import { resetStores } from './fixtures';
import AuthLayout from '../../src/app/(auth)/_layout';
import TabsLayout from '../../src/app/(tabs)/_layout';
import CustomerLayout from '../../src/app/(customer)/_layout';
import TaskerLayout from '../../src/app/(tasker)/_layout';
import SharedLayout from '../../src/app/(shared)/_layout';

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
});

describe('navigation-wiring', () => {
  it('auth layout declares all expected screens', () => {
    render(<AuthLayout />);

    expect(screen.getByTestId('stack-layout')).toBeTruthy();
    expect(screen.getByTestId('stack-index')).toBeTruthy();
    expect(screen.getByTestId('stack-role-select')).toBeTruthy();
    expect(screen.getByTestId('stack-permission-camera')).toBeTruthy();
    expect(screen.getByTestId('stack-permission-location')).toBeTruthy();
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
    expect(screen.getByTestId('tab-tasks')).toBeTruthy();

    // Customer role tab titles
    expect(screen.getByTestId('tab-index')).toHaveTextContent('MY TASKS');
    expect(screen.getByTestId('tab-bookings')).toHaveTextContent('BOOKINGS');
    expect(screen.getByTestId('tab-inbox')).toHaveTextContent('INBOX');
    expect(screen.getByTestId('tab-profile')).toHaveTextContent('PROFILE');
  });

  it('tabs layout uses role-aware titles for tasker', () => {
    useAppStore.setState({ currentRole: 'tasker' });

    render(
      <RoleProvider>
        <TabsLayout />
      </RoleProvider>,
    );

    expect(screen.getByTestId('tab-index')).toHaveTextContent('FIND WORK');
    expect(screen.getByTestId('tab-bookings')).toHaveTextContent('MY JOBS');
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
});

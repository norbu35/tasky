import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react-native';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const render = (ui: React.ReactElement, options?: any) =>
  rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);

import { resetTestI18n, setTestLanguage } from '../test-utils/mockI18n';
import { baseSession, baseProfile, resetStores, setAuthenticated } from './fixtures';
import { useAppStore } from '../../src/store/appStore';
import { RoleProvider } from '../../src/providers/RoleProvider';
import { useMyProfile } from '../../src/features/profile/hooks/useProfile';
import TabsLayout from '../../src/app/(tabs)/_layout';
import MyProfileScreen from '../../src/app/(tabs)/profile';

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

jest.mock('../../src/features/profile/hooks/useProfile', () => ({
  useMyProfile: jest.fn(),
  useUpdateProfile: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
  useSignOut: jest.fn(() => jest.fn()),
}));

const mockUseMyProfile = useMyProfile as jest.MockedFunction<typeof useMyProfile>;

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
  resetTestI18n();
  setTestLanguage('en');
});

describe('Role-based UI integration', () => {
  describe('TabsLayout tab labels by role', () => {
    it('customer role shows customer tab labels', () => {
      useAppStore.setState({ currentRole: 'customer' });

      render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );

      expect(screen.getByTestId('tab-index')).toHaveTextContent('My Tasks');
      expect(screen.getByTestId('tab-bookings')).toHaveTextContent('Bookings');
    });

    it('tasker role shows tasker tab labels', () => {
      useAppStore.setState({ currentRole: 'tasker' });

      render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );

      expect(screen.getByTestId('tab-index')).toHaveTextContent('Browse');
      expect(screen.getByTestId('tab-bookings')).toHaveTextContent('My Jobs');
    });

    it('common tabs are consistent across roles', () => {
      // Customer role
      useAppStore.setState({ currentRole: 'customer' });
      const { unmount } = render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );
      expect(screen.getByTestId('tab-inbox')).toHaveTextContent('Inbox');
      expect(screen.getByTestId('tab-profile')).toHaveTextContent('Profile');
      unmount();

      // Tasker role
      useAppStore.setState({ currentRole: 'tasker' });
      render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );
      expect(screen.getByTestId('tab-inbox')).toHaveTextContent('Inbox');
      expect(screen.getByTestId('tab-profile')).toHaveTextContent('Profile');
    });

    it('shows the global FAB only for customers', () => {
      useAppStore.setState({ currentRole: 'customer' });
      const { unmount } = render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );
      expect(screen.getByTestId('global-fab')).toBeTruthy();
      unmount();

      useAppStore.setState({ currentRole: 'tasker' });
      render(
        <RoleProvider>
          <TabsLayout />
        </RoleProvider>,
      );
      expect(screen.queryByTestId('global-fab')).toBeNull();
    });
  });

  describe('Profile screen role-based content', () => {
    it('shows login CTA when not authenticated', () => {
      // No session set (resetStores clears it)
      mockUseMyProfile.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useMyProfile>);

      render(
        <RoleProvider>
          <MyProfileScreen />
        </RoleProvider>,
      );

      expect(screen.getByText('Log in to continue')).toBeTruthy();
      expect(
        screen.getByText('You need to be logged in to view and edit your profile.'),
      ).toBeTruthy();
    });

    it('shows authenticated content when logged in as customer', () => {
      setAuthenticated(baseSession, baseProfile);
      useAppStore.setState({ currentRole: 'customer' });

      mockUseMyProfile.mockReturnValue({
        data: baseProfile,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useMyProfile>);

      render(
        <RoleProvider>
          <MyProfileScreen />
        </RoleProvider>,
      );

      expect(screen.getByText('Test Customer')).toBeTruthy();
    });
  });
});

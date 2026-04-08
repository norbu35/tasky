import React, { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  __esModule: true,
  router: mockRouter,
}));

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

type DevLoginMutation = {
  mutateAsync: (variables: {
    phone: string;
    role: 'CUSTOMER' | 'TASKER';
  }) => Promise<unknown>;
};

let latestMutation: DevLoginMutation | null = null;

function DevLoginHarness() {
  const { useDevLogin } = require('../../src/features/auth/hooks/useAuth') as {
    useDevLogin: () => DevLoginMutation;
  };
  const mutation = useDevLogin();

  useEffect(() => {
    latestMutation = mutation;
  }, [mutation]);

  return null;
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useDevLogin', () => {
  const originalDevAuth = globalThis.process?.env?.EXPO_PUBLIC_DEV_AUTH_ENABLED;

  beforeEach(() => {
    jest.clearAllMocks();
    latestMutation = null;
    if (globalThis.process) {
      globalThis.process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED = 'true';
    }
    useAuthStore.setState({ session: null, profile: null, deviceToken: null });
    useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
  });

  afterAll(() => {
    if (!globalThis.process) {
      return;
    }

    if (originalDevAuth === undefined) {
      delete globalThis.process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED;
      return;
    }

    globalThis.process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED = originalDevAuth;
  });

  it('routes first-time dev logins to onboarding instead of tabs', async () => {
    const queryClient = new QueryClient();

    render(<DevLoginHarness />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(latestMutation).not.toBeNull();
    });

    await act(async () => {
      await latestMutation?.mutateAsync({
        phone: '+97699999999',
        role: 'CUSTOMER',
      });
    });

    expect(useAuthStore.getState().session?.user.role).toBe('CUSTOMER');
    expect(useAppStore.getState().currentRole).toBe('customer');
    expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding');
  });
});

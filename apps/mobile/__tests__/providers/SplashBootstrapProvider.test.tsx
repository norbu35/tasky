import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import {
  SplashBootstrapProvider,
  useSplashBootstrap,
} from '../../src/providers/SplashBootstrapProvider';
import { useAppStore } from '../../src/store/appStore';
import { useAuthStore } from '../../src/store/authStore';

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

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      prefetchQuery: jest.fn(() => Promise.resolve()),
    }),
  };
});

jest.mock('../../src/features/bookings/api', () => ({
  listBookings: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.mock('../../src/features/profile/api', () => ({
  getMyProfile: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock('../../src/features/review/api', () => ({
  getMyPendingReviews: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../src/features/tasks/api', () => ({
  listCategories: jest.fn(() => Promise.resolve({ data: [] })),
  listMyTasks: jest.fn(() => Promise.resolve({ data: [] })),
  listTasks: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.mock('../../src/features/verification/api', () => ({
  getVerificationStatus: jest.fn(() => Promise.resolve({ data: {} })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SplashBootstrapProvider>{children}</SplashBootstrapProvider>
);

beforeEach(() => {
  jest.useFakeTimers();
  useAuthStore.setState({ session: null });
  useAppStore.setState({ hasSeenOnboarding: false });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SplashBootstrapProvider', () => {
  it('navigates to auth when no session exists', async () => {
    useAuthStore.setState({ session: null });

    const { result } = renderHook(() => useSplashBootstrap(), { wrapper });

    // Flush microtasks
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.destination).toBe('auth');
    expect(result.current.phase).toBe('ready');
  });

  it('navigates to onboarding when session exists but onboarding not seen', async () => {
    useAuthStore.setState({
      session: {
        accessToken: 'tok',
        user: { id: 'u1', role: 'CUSTOMER', email: 'a@b.c' },
      },
    });
    useAppStore.setState({ hasSeenOnboarding: false });

    const { result } = renderHook(() => useSplashBootstrap(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.destination).toBe('onboarding');

    // Advance past ONBOARDING_SPLASH_MS
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    expect(result.current.phase).toBe('ready');
  });

  it('navigates to tabs for returning user with session', async () => {
    useAuthStore.setState({
      session: {
        accessToken: 'tok',
        user: { id: 'u1', role: 'TASKER', email: 'a@b.c' },
      },
    });
    useAppStore.setState({ hasSeenOnboarding: true });

    const { result } = renderHook(() => useSplashBootstrap(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    // Advance past MINIMUM_SPLASH_MS
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.destination).toBe('tabs');
    expect(result.current.phase).toBe('ready');
  });
});

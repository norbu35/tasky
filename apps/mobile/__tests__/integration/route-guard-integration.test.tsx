import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import {
  baseProfile,
  bannedProfile,
  suspendedProfile,
  resetStores,
  setAuthenticated,
  setBannedUser,
  setSuspendedUser,
} from './fixtures';
import { useRouteGuard } from '../../src/hooks/useRouteGuard';
import { isRestricted } from '../../src/utils/routeGuard';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    Stack: ({ children }: { children?: React.ReactNode }) => {
      const { View } = require('react-native');
      return <View testID="stack-layout">{children}</View>;
    },
    useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
    router: { replace: mockReplace, push: mockPush },
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
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

function GuardConsumer({ requireAuth = true }: { requireAuth?: boolean }) {
  const { isAuthenticated, isRestricted } = useRouteGuard({ requireAuth });
  return (
    <>
      <Text testID="is-authenticated">{String(isAuthenticated)}</Text>
      <Text testID="is-restricted">{String(isRestricted)}</Text>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
});

describe('Route guard integration', () => {
  it('normal authenticated user is not redirected', () => {
    setAuthenticated();
    render(<GuardConsumer requireAuth />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('guard returns correct isAuthenticated flag', () => {
    setAuthenticated();
    render(<GuardConsumer requireAuth />);
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });

  it('guard returns correct isRestricted flag for banned', () => {
    setBannedUser();
    render(<GuardConsumer requireAuth />);
    expect(screen.getByTestId('is-restricted')).toHaveTextContent('true');
  });

  it('requireAuth=false skips auth redirect', () => {
    render(<GuardConsumer requireAuth={false} />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  describe('isRestricted utility standalone', () => {
    it('returns true for BANNED profile', () => {
      expect(isRestricted(bannedProfile)).toBe(true);
    });

    it('returns true for SUSPENDED profile', () => {
      expect(isRestricted(suspendedProfile)).toBe(true);
    });

    it('returns false for PENDING profile', () => {
      expect(isRestricted(baseProfile)).toBe(false);
    });

    it('returns false for VERIFIED profile', () => {
      expect(isRestricted({ ...baseProfile, status: 'VERIFIED' })).toBe(false);
    });

    it('returns false for null profile', () => {
      expect(isRestricted(null)).toBe(false);
    });
  });
});

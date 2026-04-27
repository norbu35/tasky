import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { FAB } from '@/components/ui/FAB';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('react-native-gesture-handler', () => {
  return {
    GestureDetector: ({ children }: { children: ReactNode }) => children,
    Gesture: {
      Tap: () => ({ onEnd: jest.fn().mockReturnThis() }),
      Pan: () => ({
        minDistance: jest.fn().mockReturnThis(),
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
      Race: jest.fn(),
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('lucide-react-native', () => {
  const { Text: MockText } = jest.requireActual('react-native') as typeof import('react-native');

  return {
    Plus: () => <MockText testID="icon-Plus" />,
  };
});

jest.mock('@/features/review/components/ReviewGateProvider', () => ({
  useReviewGate: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { session: unknown }) => unknown) =>
    selector({ session: { accessToken: 'token' } }),
}));

const mockUseReviewGate = useReviewGate as jest.MockedFunction<typeof useReviewGate>;

describe('FAB review gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides the task posting FAB while a pending review blocks posting', () => {
    mockUseReviewGate.mockReturnValue({
      isLocked: true,
      hasPending: true,
      oldestPending: {
        id: 'case-1',
        booking_id: 'booking-1',
        user_id: 'customer-1',
        status: 'PENDING',
        triggered_at: new Date().toISOString(),
      },
    });

    render(<FAB />);

    expect(screen.queryByTestId('global-fab')).toBeNull();
  });
});

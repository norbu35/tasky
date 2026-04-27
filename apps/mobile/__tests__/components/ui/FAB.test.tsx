import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { FAB } from '@/components/ui/FAB';

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

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { session: unknown }) => unknown) =>
    selector({ session: { accessToken: 'token' } }),
}));

describe('FAB visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides the task posting FAB when the owning shell marks it hidden', () => {
    render(<FAB hidden />);

    expect(screen.queryByTestId('global-fab')).toBeNull();
  });
});

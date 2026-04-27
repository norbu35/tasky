import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import NewTaskLayout from '../../../src/app/(customer)/tasks/new/_layout';
import { useReviewGate } from '../../../src/features/review/components/ReviewGateProvider';

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native') as typeof import('react-native');

  function MockStack({ children }: { children: ReactNode }) {
    return <MockText testID="new-task-stack">{children}</MockText>;
  }

  function MockStackScreen() {
    return null;
  }

  MockStack.Screen = MockStackScreen;

  function MockRedirect({ href }: { href: string }) {
    return <MockText testID="redirect">{href}</MockText>;
  }

  return {
    Redirect: MockRedirect,
    Stack: MockStack,
  };
});

jest.mock('../../../src/features/review/components/ReviewGateProvider', () => ({
  useReviewGate: jest.fn(),
}));

const mockUseReviewGate = useReviewGate as jest.MockedFunction<typeof useReviewGate>;

describe('NewTaskLayout review gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects the posting flow to the owed review while posting is locked', () => {
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

    render(<NewTaskLayout />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('/(shared)/review/booking-1');
    expect(screen.queryByTestId('new-task-stack')).toBeNull();
  });

  it('renders the posting flow when there is no pending review debt', () => {
    mockUseReviewGate.mockReturnValue({
      isLocked: false,
      hasPending: false,
      oldestPending: null,
    });

    render(<NewTaskLayout />);

    expect(screen.getByTestId('new-task-stack')).toBeTruthy();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });
});

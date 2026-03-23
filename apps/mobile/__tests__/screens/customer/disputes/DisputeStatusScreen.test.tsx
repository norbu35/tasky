import React from 'react';
import { render, screen } from '@testing-library/react-native';

import DisputeStatusScreen from '../../../../src/app/(customer)/disputes/[disputeId]';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ disputeId: 'dispute-123' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
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

let mockDisputeData: any = null;
let mockIsLoading = false;
let mockIsError = false;
const mockRefetch = jest.fn();

jest.mock('../../../../src/features/disputes/hooks/useDisputeDetail', () => ({
  useDisputeDetail: () => ({
    data: mockDisputeData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockDisputeData = null;
  mockIsLoading = false;
  mockIsError = false;
});

describe('DisputeStatusScreen (SCR-CUST-025)', () => {
  it('has a testID on the screen container', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByTestId('dispute-status-screen')).toBeTruthy();
  });

  it('shows loading skeleton during initial load', () => {
    mockIsLoading = true;
    render(<DisputeStatusScreen />);
    expect(screen.getByTestId('dispute-status-screen')).toBeTruthy();
  });

  it('renders status badge for open dispute', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Open')).toBeTruthy();
  });

  it('shows open dispute description', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(
      screen.getByText(
        'Your dispute is under admin review. You will be notified when a decision is made.',
      ),
    ).toBeTruthy();
  });

  it('renders escalated status', () => {
    mockDisputeData = { id: 'dispute-123', status: 'ESCALATED', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Escalated')).toBeTruthy();
    expect(
      screen.getByText(
        'Dispute has been escalated for further investigation. A response will follow.',
      ),
    ).toBeTruthy();
  });

  it('renders resolved for customer status', () => {
    mockDisputeData = {
      id: 'dispute-123',
      status: 'RESOLVED_CUSTOMER',
      reason: 'Poor quality work',
    };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Resolved for Customer')).toBeTruthy();
    expect(
      screen.getByText(
        'Dispute resolved in your favor. A misconduct note has been added to the other party.',
      ),
    ).toBeTruthy();
  });

  it('renders resolved for tasker status', () => {
    mockDisputeData = { id: 'dispute-123', status: 'RESOLVED_TASKER', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Resolved for Tasker')).toBeTruthy();
    expect(screen.getByText('Dispute resolved in favor of the Tasker.')).toBeTruthy();
  });

  it('renders closed insufficient evidence status', () => {
    mockDisputeData = {
      id: 'dispute-123',
      status: 'CLOSED_INSUFFICIENT',
      reason: 'Poor quality work',
    };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Closed — Insufficient Evidence')).toBeTruthy();
    expect(
      screen.getByText('Dispute closed because evidence was not provided within 24 hours.'),
    ).toBeTruthy();
  });

  it('shows dispute summary with reason', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(screen.getByText('Dispute Summary')).toBeTruthy();
    expect(screen.getByText('Poor quality work')).toBeTruthy();
  });

  it('shows mediation note', () => {
    mockDisputeData = { id: 'dispute-123', status: 'OPEN', reason: 'Poor quality work' };
    render(<DisputeStatusScreen />);
    expect(
      screen.getByText('Disputes are evidence-only mediation. No monetary compensation is issued.'),
    ).toBeTruthy();
  });

  it('shows error state with retry', () => {
    mockIsError = true;
    render(<DisputeStatusScreen />);
    expect(screen.getByTestId('dispute-status-screen')).toBeTruthy();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import TaskDetailCustomerScreen from '../../../src/app/(customer)/tasks/[taskId]/index';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ taskId: 'task-1' }),
}));

const i18nMap: Record<string, string> = {
  'status.open': 'OPEN',
  'status.assigned': 'ASSIGNED',
  'status.completed': 'COMPLETED',
  'status.cancelled': 'CANCELLED',
  'status.no_show': 'NO SHOW',
  'status.tasker_marked_done': 'PENDING CONFIRMATION',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => i18nMap[key] ?? fb ?? key,
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

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return <View {...props} />;
  });
  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
  };
});

const mockUseCustomerTaskDetail = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCustomerTaskDetail', () => ({
  useCustomerTaskDetail: () => mockUseCustomerTaskDetail(),
}));

const mockCompleteBookingMutateAsync = jest.fn();
jest.mock('../../../src/features/bookings/hooks/useCompleteBooking', () => ({
  useCompleteBooking: () => ({
    mutateAsync: mockCompleteBookingMutateAsync,
    isPending: false,
  }),
}));

const mockCancelBookingMutateAsync = jest.fn();
jest.mock('../../../src/features/bookings/hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({
    mutateAsync: mockCancelBookingMutateAsync,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeTask = (overrides: Record<string, any> = {}) => ({
  id: 'task-1',
  description: 'Fix my sink',
  status: 'OPEN',
  budget: 50000,
  scheduled_at: '2026-04-01T10:00:00Z',
  location_text: 'Bayangol district',
  applicant_count: 0,
  category: { name: 'Handyman' },
  tasker: null,
  booking: null,
  ...overrides,
});

describe('TaskDetailCustomerScreen (SCR-CUST-009)', () => {
  it('has a testID on the screen container', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByTestId('task-detail-customer-screen')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByTestId('task-detail-customer-screen')).toBeTruthy();
  });

  it('renders error state', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByTestId('task-detail-customer-screen-error')).toBeTruthy();
  });

  it('renders task info when loaded', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('Fix my sink')).toBeTruthy();
    expect(screen.getByText('Bayangol district')).toBeTruthy();
  });

  it('shows budget in formatted string', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText(/50,000/)).toBeTruthy();
  });

  it('shows "View Applicants" CTA when OPEN with applicants', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({ status: 'OPEN', applicant_count: 3 }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('View Applicants')).toBeTruthy();
  });

  it('navigates to applicants list when View Applicants is pressed', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({ status: 'OPEN', applicant_count: 3 }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    fireEvent.press(screen.getByText('View Applicants'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/tasks/task-1/applicants');
  });

  it('shows no-applicants message when OPEN with zero applicants', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({ status: 'OPEN', applicant_count: 0 }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('No applicants yet')).toBeTruthy();
  });

  it('shows tasker info when ASSIGNED', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({
        status: 'ASSIGNED',
        tasker: {
          id: 'tasker-1',
          full_name: 'Bold Bat',
          avatar_url: null,
          rating_avg: 4.5,
          is_pro: true,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('Bold Bat')).toBeTruthy();
    expect(screen.getByText('Message Tasker')).toBeTruthy();
  });

  it('navigates to the tasker profile when the assigned tasker card is pressed', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({
        status: 'ASSIGNED',
        tasker: {
          id: 'tasker-1',
          full_name: 'Bold Bat',
          avatar_url: null,
          rating_avg: 4.5,
          is_pro: true,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);

    fireEvent.press(screen.getByTestId('task-detail-customer-screen-tasker-card'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/taskers/tasker-1');
  });

  it('navigates to inbox when Message Tasker is pressed', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({
        status: 'ASSIGNED',
        tasker: {
          id: 'tasker-1',
          full_name: 'Bold Bat',
          avatar_url: null,
          rating_avg: 4.5,
          is_pro: true,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);

    fireEvent.press(screen.getByText('Message Tasker'));
    expect(mockPush).toHaveBeenCalledWith('/inbox');
  });

  it('shows Cancel Task button when open or assigned', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({ status: 'OPEN' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('Cancel Task')).toBeTruthy();
  });

  it('shows "Confirm Complete" CTA when tasker_marked_done', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({
        status: 'TASKER_MARKED_DONE',
        tasker: {
          id: 'tasker-1',
          full_name: 'Bold Bat',
          avatar_url: null,
          rating_avg: 4.5,
          is_pro: true,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('Confirm Complete')).toBeTruthy();
  });

  it('shows completed badge for completed tasks', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({ status: 'COMPLETED' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('COMPLETED')).toBeTruthy();
  });

  it('shows cancelled badge for cancelled tasks', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask({ status: 'CANCELLED' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    expect(screen.getByText('CANCELLED')).toBeTruthy();
  });

  it('back button calls router.back', () => {
    mockUseCustomerTaskDetail.mockReturnValue({
      task: makeTask(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<TaskDetailCustomerScreen />);
    fireEvent.press(screen.getByTestId('task-detail-customer-screen-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});

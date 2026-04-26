import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import ApplicantsListScreen from '../../../src/app/(customer)/tasks/[taskId]/applicants';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ taskId: 'task-1' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return <View {...props}>{props.children}</View>;
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

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

const mockUseApplications = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useApplications', () => ({
  useApplications: () => mockUseApplications(),
}));

const mockUseCustomerTaskDetail = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCustomerTaskDetail', () => ({
  useCustomerTaskDetail: () => mockUseCustomerTaskDetail(),
}));

beforeEach(() => {
  const { resetTestI18n, setTestLanguage } = require('../../test-utils/mockI18n');
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
  mockUseCustomerTaskDetail.mockReturnValue({
    task: {
      description: 'Fix my sink',
      budget: 50000,
      scheduled_at: '2026-04-03T10:00:00Z',
    },
  });
});

const makeApplicant = (overrides: Record<string, any> = {}) => ({
  id: 'app-1',
  task_id: 'task-1',
  tasker_id: 'tasker-1',
  message: 'I can help with this',
  tasker: {
    id: 'tasker-1',
    full_name: 'Bold Bat',
    avatar_url: null,
    rating_avg: 4.5,
    completed_tasks: 12,
    is_pro: true,
  },
  ...overrides,
});

describe('ApplicantsListScreen (SCR-CUST-011)', () => {
  it('has a testID on the screen container', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByTestId('applicants-list-screen')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseApplications.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders empty state when no applicants', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('No applicants yet')).toBeTruthy();
    expect(
      screen.getByText('Once taskers apply to your task, they will appear here.'),
    ).toBeTruthy();
  });

  it('renders applicant cards with structured comparison signals instead of recommendations', () => {
    mockUseApplications.mockReturnValue({
      data: {
        data: [
          makeApplicant({ recommended: true, quote_price: 65000 }),
          makeApplicant({
            id: 'app-2',
            tasker_id: 'tasker-2',
            tasker: {
              id: 'tasker-2',
              full_name: 'Sarnai D',
              avatar_url: null,
              rating_avg: 4.8,
              completed_tasks: 20,
              is_pro: true,
            },
          }),
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('Bold Bat')).toBeTruthy();
    expect(screen.getByText('Sarnai D')).toBeTruthy();
    expect(screen.getAllByText('Verified identity').length).toBeGreaterThan(0);
    expect(screen.getByText('Quote: ₮65,000')).toBeTruthy();
    expect(screen.queryByText('Recommended')).toBeNull();
  });

  it('hides applicant rating evidence below the public review threshold', () => {
    mockUseApplications.mockReturnValue({
      data: {
        data: [
          makeApplicant({
            tasker: {
              id: 'tasker-1',
              full_name: 'Bold Bat',
              avatar_url: null,
              rating_avg: 4.9,
              completed_tasks: 2,
              is_pro: true,
            },
          }),
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<ApplicantsListScreen />);

    expect(screen.queryByText('4.9')).toBeNull();
    expect(screen.getByText('Not enough reviews yet')).toBeTruthy();
  });

  it('renders Accept buttons for each applicant', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('Accept')).toBeTruthy();
  });

  it('renders View Profile buttons', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByText('View Profile')).toBeTruthy();
  });

  it('View Profile navigates to tasker profile', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    fireEvent.press(screen.getByText('View Profile'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/taskers/tasker-1');
  });

  it('Accept opens a confirmation sheet before navigation', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    fireEvent.press(screen.getByText('Accept'));
    expect(screen.getByTestId('applicant-accept-sheet')).toBeTruthy();
    expect(screen.getByText('Select this Tasker?')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
  });

  it('Confirm navigates to booking confirmation with params', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    fireEvent.press(screen.getByText('Accept'));
    fireEvent.press(screen.getByTestId('applicant-accept-sheet-confirm'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/bookings/confirm',
      params: expect.objectContaining({
        taskId: 'task-1',
        applicationId: 'app-1',
        taskerId: 'tasker-1',
        taskTitle: 'Fix my sink',
        taskBudget: '50000',
        taskSchedule: '2026-04-03T10:00:00Z',
        taskerName: 'Bold Bat',
        taskerRating: '4.5',
        source: 'application',
      }),
    });
  });

  it('shows verified badge for verified taskers', () => {
    mockUseApplications.mockReturnValue({
      data: { data: [makeApplicant()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ApplicantsListScreen />);
    expect(screen.getByTestId('icon-CheckCircle')).toBeTruthy();
  });
});

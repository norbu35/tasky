import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { NoApplicantRescue } from '../../../src/features/tasks/components/NoApplicantRescue';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

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

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NoApplicantRescue (SCR-CUST-026)', () => {
  it('has a testID on the container', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    expect(screen.getByTestId('no-applicant-rescue')).toBeTruthy();
  });

  it('shows rescue prompt title', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    expect(screen.getByText('No applicants yet')).toBeTruthy();
  });

  it('shows adjust budget option', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    expect(screen.getByText('Increase Budget')).toBeTruthy();
  });

  it('shows adjust schedule option', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    expect(screen.getByText('Change Schedule')).toBeTruthy();
  });

  it('shows request concierge option', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    expect(screen.getByText('Request Help')).toBeTruthy();
  });

  it('shows supporting rescue descriptions for each action', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );

    expect(screen.getByText('Boost your task to get responses faster.')).toBeTruthy();
    expect(screen.getByText('Raise the offer to attract more qualified taskers.')).toBeTruthy();
    expect(screen.getByText('Move the schedule to a time with stronger availability.')).toBeTruthy();
    expect(screen.getByText('Ask Tasky concierge to help review and rescue this task.')).toBeTruthy();
  });

  it('calls onAdjustBudget when budget option is pressed', () => {
    const onAdjustBudget = jest.fn();
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={onAdjustBudget}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Increase Budget'));
    expect(onAdjustBudget).toHaveBeenCalled();
  });

  it('calls onAdjustSchedule when schedule option is pressed', () => {
    const onAdjustSchedule = jest.fn();
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={onAdjustSchedule}
        onRequestConcierge={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Change Schedule'));
    expect(onAdjustSchedule).toHaveBeenCalled();
  });

  it('calls onRequestConcierge when help option is pressed', () => {
    const onRequestConcierge = jest.fn();
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={onRequestConcierge}
      />,
    );
    fireEvent.press(screen.getByText('Request Help'));
    expect(onRequestConcierge).toHaveBeenCalled();
  });

  it('shows dismiss button', () => {
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    expect(screen.getByText('Dismiss')).toBeTruthy();
  });

  it('calls onClose when dismiss is pressed', () => {
    const onClose = jest.fn();
    render(
      <NoApplicantRescue
        isOpen={true}
        onClose={onClose}
        taskId="task-1"
        onAdjustBudget={jest.fn()}
        onAdjustSchedule={jest.fn()}
        onRequestConcierge={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Dismiss'));
    expect(onClose).toHaveBeenCalled();
  });
});

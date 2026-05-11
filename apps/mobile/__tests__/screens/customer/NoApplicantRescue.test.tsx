import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { NoApplicantRescue } from '../../../src/features/tasks/components/NoApplicantRescue';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
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
  const { resetTestI18n, setTestLanguage } = require('../../test-utils/mockI18n');
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
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
    expect(screen.getByText('Одоохондоо өргөдөл байхгүй')).toBeTruthy();
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
    expect(screen.getByText('Үнийг нэмэгдүүлэх')).toBeTruthy();
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
    expect(screen.getByText('Хуваарь өөрчлөх')).toBeTruthy();
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
    expect(screen.getByText('Тусламж хүсэх')).toBeTruthy();
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

    expect(
      screen.getByText(
        '120 минутад ямар нэг гүйцэтгэгч хүсэлт гаргаагүй байна. Дараах сонголтуудаас сонгоно уу.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Төсөв нэмснээр гүйцэтгэгч олдох магадлал өснө.')).toBeTruthy();
    expect(screen.getByText('Шинэ цаг сонгосноор илүү олон гүйцэтгэгчид харагдана.')).toBeTruthy();
    expect(
      screen.getByText('Туслах ажилтанд илгээж, даалгаврыг гараар хуваарилуулна.'),
    ).toBeTruthy();
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
    fireEvent.press(screen.getByText('Үнийг нэмэгдүүлэх'));
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
    fireEvent.press(screen.getByText('Хуваарь өөрчлөх'));
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
    fireEvent.press(screen.getByText('Тусламж хүсэх'));
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
    expect(screen.getByText('Хаах')).toBeTruthy();
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
    fireEvent.press(screen.getByText('Хаах'));
    expect(onClose).toHaveBeenCalled();
  });
});

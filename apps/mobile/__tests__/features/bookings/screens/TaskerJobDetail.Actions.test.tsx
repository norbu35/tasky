import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TaskerJobDetailActions } from '../../../../src/features/bookings/screens/TaskerJobDetail.Actions';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, name) => (props: React.ComponentProps<typeof Text>) => (
        <Text testID={`icon-${String(name)}`} {...props} />
      ),
    },
  );
});

const handlers = {
  onOpenSupport: jest.fn(),
  onOpenNoShow: jest.fn(),
  onOpenCancel: jest.fn(),
  onLeaveReview: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('TaskerJobDetailActions', () => {
  it('renders assigned-job support, no-show, and cancel actions', () => {
    render(<TaskerJobDetailActions isAssigned isCompleted={false} {...handlers} />);

    fireEvent.press(screen.getByTestId('booking-detail-tasker-support'));
    fireEvent.press(screen.getByTestId('booking-detail-tasker-no-show'));
    fireEvent.press(screen.getByTestId('booking-detail-tasker-cancel'));

    expect(screen.getByText('Тусламж авах')).toBeTruthy();
    expect(screen.getByText('Захиалагч ирсэнгүй')).toBeTruthy();
    expect(screen.getByText('Захиалга цуцлах')).toBeTruthy();
    expect(handlers.onOpenSupport).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenNoShow).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onLeaveReview).not.toHaveBeenCalled();
  });

  it('renders only the review action after completion', () => {
    render(<TaskerJobDetailActions isAssigned={false} isCompleted {...handlers} />);

    fireEvent.press(screen.getByTestId('booking-detail-tasker-review'));

    expect(screen.getByText('Шүүмж үлдээх')).toBeTruthy();
    expect(screen.queryByTestId('booking-detail-tasker-support')).toBeNull();
    expect(handlers.onLeaveReview).toHaveBeenCalledTimes(1);
  });

  it('renders no actions for statuses that are neither assigned nor completed', () => {
    const { toJSON } = render(
      <TaskerJobDetailActions isAssigned={false} isCompleted={false} {...handlers} />,
    );

    expect(toJSON()).toBeNull();
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet({ children, index }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({ snapToIndex: jest.fn(), close: jest.fn() }));
      if (index === -1) return null;
      return <View>{children}</View>;
    }),
    BottomSheetBackdrop: ({ children }: any) => <View>{children}</View>,
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
  };
});

const mockClose = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('InstantMatchTaskerSheet (SCR-P3-005)', () => {
  it('renders the incoming match notification shell', () => {
    const {
      InstantMatchTaskerSheet,
    } = require('../../../../src/features/matching/components/InstantMatchTaskerSheet');
    render(<InstantMatchTaskerSheet isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('New offer!')).toBeTruthy();
    expect(screen.getByText('5:00')).toBeTruthy();
    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Decline')).toBeTruthy();
    expect(screen.getByText('₮45,000')).toBeTruthy();
  });

  it('shows the accepted success state after tapping accept', () => {
    const {
      InstantMatchTaskerSheet,
    } = require('../../../../src/features/matching/components/InstantMatchTaskerSheet');
    render(<InstantMatchTaskerSheet isOpen={true} onClose={mockClose} />);

    fireEvent.press(screen.getByText('Accept'));

    expect(screen.getByText('Success!')).toBeTruthy();
    expect(screen.getByText('A new booking was created. Check My Jobs section.')).toBeTruthy();
  });

  it('calls onClose when declining', () => {
    const {
      InstantMatchTaskerSheet,
    } = require('../../../../src/features/matching/components/InstantMatchTaskerSheet');
    render(<InstantMatchTaskerSheet isOpen={true} onClose={mockClose} />);

    fireEvent.press(screen.getByText('Decline'));
    expect(mockClose).toHaveBeenCalled();
  });

  it('resets from the accepted state when reopened for a new task', () => {
    const {
      InstantMatchTaskerSheet,
    } = require('../../../../src/features/matching/components/InstantMatchTaskerSheet');
    const { rerender } = render(
      <InstantMatchTaskerSheet isOpen={true} onClose={mockClose} taskTitle="Эхний санал" />,
    );

    fireEvent.press(screen.getByText('Accept'));
    expect(screen.getByText('Success!')).toBeTruthy();

    rerender(
      <InstantMatchTaskerSheet isOpen={false} onClose={mockClose} taskTitle="Эхний санал" />,
    );
    rerender(
      <InstantMatchTaskerSheet isOpen={true} onClose={mockClose} taskTitle="Хоёр дахь санал" />,
    );

    expect(screen.queryByText('Success!')).toBeNull();
    expect(screen.getByText('Хоёр дахь санал')).toBeTruthy();
  });
});

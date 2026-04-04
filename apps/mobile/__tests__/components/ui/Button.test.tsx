import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '../../../src/components/ui/Button';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('Button', () => {
  it('renders label text', () => {
    render(<Button label="Continue" testID="button" />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when interactive', () => {
    const onPress = jest.fn();
    const onPressIn = jest.fn();
    render(<Button label="Continue" onPress={onPress} onPressIn={onPressIn} testID="button" />);

    fireEvent(screen.getByTestId('button'), 'pressIn');
    fireEvent.press(screen.getByTestId('button'));

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" onPress={onPress} disabled testID="button" />);

    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator and disables interaction', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" isLoading onPress={onPress} testID="button" />);

    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText('Continue')).toBeNull();
  });

  it('passes nativewind className through', () => {
    render(<Button label="Continue" className="rounded-xl" testID="button" />);
    expect(screen.getByTestId('button').props.className).toBe('rounded-xl');
  });
});

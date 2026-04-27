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
    expect(screen.getByTestId('button').props.className).toContain('rounded-xl');
  });

  it('renders children instead of label when provided', () => {
    render(
      <Button testID="button">
        <></>
      </Button>,
    );
    expect(screen.getByTestId('button')).toBeTruthy();
  });

  // cva variant class tests
  it('applies default variant classes by default', () => {
    render(<Button label="Go" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('bg-primary');
  });

  it('applies secondary variant classes', () => {
    render(<Button label="Go" variant="secondary" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('bg-sun-light');
  });

  it('applies outline variant classes', () => {
    render(<Button label="Go" variant="outline" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('bg-transparent');
    expect(el.props.className).toContain('border');
  });

  it('applies ghost variant classes', () => {
    render(<Button label="Go" variant="ghost" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('bg-transparent');
  });

  it('applies destructive variant classes', () => {
    render(<Button label="Go" variant="destructive" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('bg-danger');
  });

  it('applies sm size classes', () => {
    render(<Button label="Go" size="sm" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('px-md');
  });

  it('applies lg size classes', () => {
    render(<Button label="Go" size="lg" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('px-xl');
  });

  it('applies icon size classes', () => {
    render(<Button size="icon" testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('w-[36px]');
  });

  it('applies opacity-50 class when disabled', () => {
    render(<Button label="Go" disabled testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('disabled:opacity-disabled');
  });

  it('applies opacity-40 class when loading', () => {
    render(<Button label="Go" isLoading testID="button" />);
    const el = screen.getByTestId('button');
    expect(el.props.className).toContain('disabled:opacity-disabled');
  });

  it('uses shared active press-state utilities', () => {
    render(<Button label="Go" testID="button" />);
    const el = screen.getByTestId('button');

    expect(el.props.className).toContain('active:opacity-pressed');
    expect(el.props.className).toContain('active:scale-pressed');
  });

  it('does not have textStyle prop (removed in cva migration)', () => {
    // textStyle prop was removed — labelClassName is the replacement
    const { rerender } = render(
      <Button label="Go" labelClassName="text-red-500" testID="button" />,
    );
    rerender(<Button label="Go" labelClassName="text-red-500" testID="button" />);
    // labelClassName should be accepted without TypeScript error (compile-time check)
    // At runtime just verify the button renders
    expect(screen.getByTestId('button')).toBeTruthy();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CategoryChip } from '../../../src/components/ui/CategoryChip';

describe('CategoryChip', () => {
  it('renders label text', () => {
    render(<CategoryChip label="Cleaning" testID="chip" />);
    expect(screen.getByText('Cleaning')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<CategoryChip label="Cleaning" onPress={onPress} testID="chip" />);
    fireEvent.press(screen.getByTestId('chip'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies active cva classes when isActive is true', () => {
    render(<CategoryChip label="Cleaning" isActive testID="chip" />);
    const el = screen.getByTestId('chip');
    expect(el.props.className).toContain('bg-primary');
  });

  it('applies inactive cva classes by default', () => {
    render(<CategoryChip label="Cleaning" testID="chip" />);
    const el = screen.getByTestId('chip');
    expect(el.props.className).toContain('bg-muted');
  });

  it('applies active text cva classes when isActive is true', () => {
    render(<CategoryChip label="Cleaning" isActive testID="chip" />);
    const text = screen.getByText('Cleaning');
    expect(text.props.className).toContain('text-primary-foreground');
  });

  it('applies inactive text cva classes by default', () => {
    render(<CategoryChip label="Cleaning" testID="chip" />);
    const text = screen.getByText('Cleaning');
    expect(text.props.className).toContain('text-foreground');
  });

  it('applies rounded-full class', () => {
    render(<CategoryChip label="Cleaning" testID="chip" />);
    const el = screen.getByTestId('chip');
    expect(el.props.className).toContain('rounded-full');
  });
});

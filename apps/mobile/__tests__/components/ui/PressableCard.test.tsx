import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PressableCard } from '../../../src/components/ui/PressableCard';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('PressableCard', () => {
  it('renders children', () => {
    render(
      <PressableCard onPress={jest.fn()} testID="card">
        <Text>Content</Text>
      </PressableCard>,
    );
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <PressableCard onPress={onPress} testID="card">
        <Text>Content</Text>
      </PressableCard>,
    );
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has accessibilityRole button', () => {
    render(
      <PressableCard onPress={jest.fn()} testID="card">
        <Text>Content</Text>
      </PressableCard>,
    );
    expect(screen.getByTestId('card').props.accessibilityRole).toBe('button');
  });

  it('accepts className prop', () => {
    render(
      <PressableCard onPress={jest.fn()} testID="card" className="rounded-xl">
        <Text>Content</Text>
      </PressableCard>,
    );
    expect(screen.getByTestId('card').props.className).toContain('rounded-xl');
  });

  it('fires pressIn and pressOut handlers', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    render(
      <PressableCard
        onPress={jest.fn()}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        testID="card"
      >
        <Text>Content</Text>
      </PressableCard>,
    );
    fireEvent(screen.getByTestId('card'), 'pressIn');
    fireEvent(screen.getByTestId('card'), 'pressOut');
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });
});

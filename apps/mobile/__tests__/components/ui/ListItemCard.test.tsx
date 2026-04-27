import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ListItemCard } from '../../../src/components/ui/ListItemCard';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('ListItemCard', () => {
  it('uses Touchable with shared interaction state classes', () => {
    const onPress = jest.fn();
    render(<ListItemCard title="Task" subtitle="Today" onPress={onPress} testID="list-item" />);

    const item = screen.getByTestId('list-item');
    expect(item.props.accessibilityRole).toBe('button');
    expect(item.props.className).toContain('active:opacity-pressed');
    expect(item.props.className).toContain('active:scale-pressed');

    fireEvent.press(item);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

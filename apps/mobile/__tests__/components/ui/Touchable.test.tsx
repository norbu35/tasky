import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { Touchable } from '../../../src/components/ui/Touchable';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('Touchable', () => {
  it('renders children', () => {
    render(
      <Touchable testID="touchable">
        <Text>Tap me</Text>
      </Touchable>,
    );
    expect(screen.getByText('Tap me')).toBeTruthy();
  });

  it('passes testID', () => {
    render(
      <Touchable testID="my-touchable">
        <Text>Content</Text>
      </Touchable>,
    );
    expect(screen.getByTestId('my-touchable')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <Touchable testID="touchable" onPress={onPress}>
        <Text>Tap</Text>
      </Touchable>,
    );
    fireEvent.press(screen.getByTestId('touchable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('warns in DEV when testID is missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(
      <Touchable>
        <Text>No testID</Text>
      </Touchable>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Touchable: testID is required for all interactive elements',
    );
    warnSpy.mockRestore();
  });

  it('accepts className prop', () => {
    render(
      <Touchable testID="touchable" className="rounded-lg p-md">
        <Text>Styled</Text>
      </Touchable>,
    );
    const el = screen.getByTestId('touchable');
    expect(el.props.className).toContain('rounded-lg');
    expect(el.props.className).toContain('p-md');
  });
});

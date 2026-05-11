import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { ModalSheetTemplate } from '../../../src/components/templates/ModalSheetTemplate';

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet({ children, index }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({
        snapToIndex: jest.fn(),
        close: jest.fn(),
      }));
      if (index === -1) return null;
      return <View>{children}</View>;
    }),
    BottomSheetBackdrop: ({ children }: any) => <View>{children}</View>,
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
  };
});

describe('ModalSheetTemplate', () => {
  it('uses a full-screen overlay container only while open', () => {
    const { rerender } = render(
      <ModalSheetTemplate isOpen={true} onClose={jest.fn()} testID="test-sheet">
        <Text>Sheet content</Text>
      </ModalSheetTemplate>,
    );

    const openSheet = screen.getByTestId('test-sheet');
    expect(openSheet.props.pointerEvents).toBe('auto');
    expect(StyleSheet.flatten(openSheet.props.style)).toEqual(
      expect.objectContaining({
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }),
    );

    rerender(
      <ModalSheetTemplate isOpen={false} onClose={jest.fn()} testID="test-sheet">
        <Text>Sheet content</Text>
      </ModalSheetTemplate>,
    );

    expect(screen.getByTestId('test-sheet').props.pointerEvents).toBe('none');
  });
});

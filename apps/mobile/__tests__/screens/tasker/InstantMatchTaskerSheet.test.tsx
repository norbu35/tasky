import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { InstantMatchTaskerSheet } from '../../../src/features/matching/components/InstantMatchTaskerSheet';

describe('InstantMatchTaskerSheet (SCR-P3-005)', () => {
  it('renders the default instant match shell', () => {
    render(
      <InstantMatchTaskerSheet
        isOpen
        onClose={jest.fn()}
        taskTitle="Гал тогооны цэвэрлэгээ"
        budgetLabel="₮45,000"
        onAccept={jest.fn()}
        onDecline={jest.fn()}
      />,
    );

    expect(screen.getByTestId('instant-match-sheet')).toBeTruthy();
    expect(screen.getByText('Шинэ санал!')).toBeTruthy();
    expect(screen.getByText('Гал тогооны цэвэрлэгээ')).toBeTruthy();
    expect(screen.getByText('Хүлээн авах')).toBeTruthy();
    expect(screen.getByText('Татгалзах')).toBeTruthy();
  });

  it('accept triggers the callback', () => {
    const onAccept = jest.fn();
    render(
      <InstantMatchTaskerSheet
        isOpen
        onClose={jest.fn()}
        taskTitle="Гал тогооны цэвэрлэгээ"
        budgetLabel="₮45,000"
        onAccept={onAccept}
        onDecline={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('instant-match-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
